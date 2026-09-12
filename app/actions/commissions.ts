"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runProgressionEvaluation, computeSalespersonStats, computeRankProgress } from "@/lib/progression/engine";
import type { ActionResult } from "./salespeople";

const DEFAULT_COMMISSION_AMOUNT = 150.0;

/**
 * Resolves the REAL commission amount for one milestone, based on the
 * salesperson's current rank. If their rank has a specific per-milestone
 * amount set, that replaces the $150 default entirely — this is what
 * makes rank progression actually mean something financially, not
 * just a badge.
 */
async function resolveCommissionAmount(salespersonId: string): Promise<number> {
  const stats = await computeSalespersonStats(salespersonId);
  const { currentRank } = await computeRankProgress(stats.businessesSoldLifetime);
  if (currentRank?.commission_per_milestone !== null && currentRank?.commission_per_milestone !== undefined) {
    return Number(currentRank.commission_per_milestone);
  }
  return DEFAULT_COMMISSION_AMOUNT;
}

async function requireAdmin(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can do this.");
}

/**
 * Marks the business's first paid month as complete — this is the
 * exact moment, per the spec, that Commission #1 ($150) becomes real.
 * Creates the commission record (status: pending) and advances the
 * business's pipeline status. Admin-only: salespeople can view their
 * commissions but never trigger or edit them, matching the spec's
 * explicit security requirement.
 */
export async function markFirstMonthCompleteAction(businessId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("assigned_to").eq("id", businessId).single();
  if (!business?.assigned_to) return { success: false, error: "This business has no salesperson assigned — nobody to pay a commission to." };

  const today = new Date().toISOString().slice(0, 10);

  const { error: businessError } = await admin
    .from("businesses")
    .update({ first_month_completed_at: today, status: "commission_1_pending" })
    .eq("id", businessId);
  if (businessError) return { success: false, error: businessError.message };

  const commissionAmount = await resolveCommissionAmount(business.assigned_to);
  const { error: commissionError } = await admin.from("commissions").upsert(
    { business_id: businessId, salesperson_id: business.assigned_to, commission_number: 1, amount: commissionAmount, status: "pending", eligible_date: today },
    { onConflict: "business_id,commission_number" }
  );
  if (commissionError) return { success: false, error: commissionError.message };

  // A real sales event just happened — re-check ranks/milestones/
  // promotions against this salesperson's actual updated stats.
  await runProgressionEvaluation(business.assigned_to);

  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function markSecondMonthCompleteAction(businessId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin.from("businesses").select("assigned_to").eq("id", businessId).single();
  if (!business?.assigned_to) return { success: false, error: "This business has no salesperson assigned." };

  const today = new Date().toISOString().slice(0, 10);

  const { error: businessError } = await admin
    .from("businesses")
    .update({ second_month_completed_at: today, status: "commission_2_pending" })
    .eq("id", businessId);
  if (businessError) return { success: false, error: businessError.message };

  const commissionAmount = await resolveCommissionAmount(business.assigned_to);
  const { error: commissionError } = await admin.from("commissions").upsert(
    { business_id: businessId, salesperson_id: business.assigned_to, commission_number: 2, amount: commissionAmount, status: "pending", eligible_date: today },
    { onConflict: "business_id,commission_number" }
  );
  if (commissionError) return { success: false, error: commissionError.message };

  await runProgressionEvaluation(business.assigned_to);

  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function markCommissionPaidAction(commissionId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: commission, error } = await admin
    .from("commissions")
    .update({ status: "paid", paid_date: today })
    .eq("id", commissionId)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  // If this was commission #2 being paid, the business's full
  // lifecycle with this salesperson is now complete, per the spec.
  if (commission.commission_number === 2) {
    await admin.from("businesses").update({ status: "completed" }).eq("id", commission.business_id);
  } else {
    await admin.from("businesses").update({ status: "commission_1_paid" }).eq("id", commission.business_id);
  }

  // Commission actually paid — "commission_earned" milestones (which
  // deliberately only count PAID, not pending, amounts) may newly
  // qualify now.
  await runProgressionEvaluation(commission.salesperson_id);

  revalidatePath("/admin/commissions");
  return { success: true };
}
