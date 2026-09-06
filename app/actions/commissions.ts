"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./salespeople";

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

  const { error: commissionError } = await admin.from("commissions").upsert(
    { business_id: businessId, salesperson_id: business.assigned_to, commission_number: 1, amount: 150.0, status: "pending", eligible_date: today },
    { onConflict: "business_id,commission_number" }
  );
  if (commissionError) return { success: false, error: commissionError.message };

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

  const { error: commissionError } = await admin.from("commissions").upsert(
    { business_id: businessId, salesperson_id: business.assigned_to, commission_number: 2, amount: 150.0, status: "pending", eligible_date: today },
    { onConflict: "business_id,commission_number" }
  );
  if (commissionError) return { success: false, error: commissionError.message };

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

  revalidatePath("/admin/commissions");
  return { success: true };
}
