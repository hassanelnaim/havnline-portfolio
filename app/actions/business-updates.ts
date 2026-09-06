"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./salespeople";
import type { PipelineStatus } from "@/lib/database/types";

/**
 * Uses the REGULAR (RLS-protected) client, not the admin client — so
 * a salesperson can only ever update a business that's actually
 * assigned to them, enforced by the database itself, not just this
 * action's own logic.
 */
async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, userId: user.id };
}

export async function logCallAction(businessId: string, note: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const { data: business } = await ctx.supabase.from("businesses").select("call_attempts").eq("id", businessId).maybeSingle();
  if (!business) return { success: false, error: "Business not found or not accessible." };

  const { error } = await ctx.supabase
    .from("businesses")
    .update({ call_attempts: (business.call_attempts || 0) + 1, last_contacted: new Date().toISOString() })
    .eq("id", businessId);
  if (error) return { success: false, error: error.message };

  await ctx.supabase.from("activity_log").insert({ business_id: businessId, salesperson_id: ctx.userId, type: "call", content: note || null });

  revalidatePath(`/sales/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function addNoteAction(businessId: string, note: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  if (!note.trim()) return { success: false, error: "Note cannot be empty." };

  const { error } = await ctx.supabase.from("activity_log").insert({ business_id: businessId, salesperson_id: ctx.userId, type: "note", content: note });
  if (error) return { success: false, error: error.message };

  revalidatePath(`/sales/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function scheduleFollowupAction(businessId: string, date: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const { error } = await ctx.supabase.from("businesses").update({ next_followup: date }).eq("id", businessId);
  if (error) return { success: false, error: error.message };

  await ctx.supabase.from("activity_log").insert({ business_id: businessId, salesperson_id: ctx.userId, type: "followup_scheduled", content: `Follow-up scheduled for ${date}` });

  revalidatePath(`/sales/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function changeStatusAction(businessId: string, status: PipelineStatus): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const { error } = await ctx.supabase.from("businesses").update({ status }).eq("id", businessId);
  if (error) return { success: false, error: error.message };

  await ctx.supabase.from("activity_log").insert({ business_id: businessId, salesperson_id: ctx.userId, type: "status_change", content: `Status changed to ${status}` });

  revalidatePath(`/sales/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/sales/leads");
  revalidatePath("/admin/leads");
  return { success: true };
}

export async function startTrialAction(businessId: string, trialStart: string, trialEnd: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireUser();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authenticated." };
  }

  const { error } = await ctx.supabase.from("businesses").update({ status: "trial", trial_start: trialStart, trial_end: trialEnd }).eq("id", businessId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/sales/businesses/${businessId}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}
