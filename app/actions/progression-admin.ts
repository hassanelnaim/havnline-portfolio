"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./salespeople";
import type { MilestoneRequirementType, RewardType } from "@/lib/database/types";

async function requireAdmin(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can do this.");
  return user.id;
}

// ---------- Ranks ----------

export interface RankInput {
  name: string;
  description: string;
  minBusinessesSold: number;
  badgeEmoji: string;
  color: string;
  benefits: string;
  commissionBonusPercent: number;
  commissionPerMilestone: number | null;
  sortOrder: number;
}

export async function createRankAction(input: RankInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("ranks").insert({
    name: input.name, description: input.description || null, min_businesses_sold: input.minBusinessesSold,
    badge_emoji: input.badgeEmoji || "🏅", color: input.color || "#2563EB", benefits: input.benefits || null,
    commission_bonus_percent: input.commissionBonusPercent || 0, commission_per_milestone: input.commissionPerMilestone, sort_order: input.sortOrder,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/ranks");
  return { success: true };
}

export async function updateRankAction(id: string, input: RankInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("ranks").update({
    name: input.name, description: input.description || null, min_businesses_sold: input.minBusinessesSold,
    badge_emoji: input.badgeEmoji, color: input.color, benefits: input.benefits || null,
    commission_bonus_percent: input.commissionBonusPercent, commission_per_milestone: input.commissionPerMilestone, sort_order: input.sortOrder,
  }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/ranks");
  return { success: true };
}

export async function deleteRankAction(id: string): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("ranks").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/ranks");
  return { success: true };
}

// ---------- Milestones ----------

export interface MilestoneInput {
  name: string;
  description: string;
  icon: string;
  requirementType: MilestoneRequirementType;
  requirementValue: number;
  rewardType: RewardType;
  rewardDescription: string;
  rewardAmount: number | null;
  isVisible: boolean;
  sortOrder: number;
}

export async function createMilestoneAction(input: MilestoneInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("milestones").insert({
    name: input.name, description: input.description || null, icon: input.icon || "🎯",
    requirement_type: input.requirementType, requirement_value: input.requirementValue,
    reward_type: input.rewardType, reward_description: input.rewardDescription || null,
    reward_amount: input.rewardAmount, is_visible: input.isVisible, sort_order: input.sortOrder,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/milestones");
  return { success: true };
}

export async function updateMilestoneAction(id: string, input: MilestoneInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("milestones").update({
    name: input.name, description: input.description || null, icon: input.icon,
    requirement_type: input.requirementType, requirement_value: input.requirementValue,
    reward_type: input.rewardType, reward_description: input.rewardDescription || null,
    reward_amount: input.rewardAmount, is_visible: input.isVisible, sort_order: input.sortOrder,
  }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/milestones");
  return { success: true };
}

export async function deleteMilestoneAction(id: string): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("milestones").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/milestones");
  return { success: true };
}

export async function toggleMilestoneActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("milestones").update({ is_active: isActive }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/milestones");
  return { success: true };
}

// ---------- Promotions ----------

export interface PromotionInput {
  title: string;
  description: string;
  requiredBusinessesSold: number;
  requiredRetentionPercent: number | null;
  benefits: string;
  approvalType: "automatic" | "admin_approval";
  sortOrder: number;
}

export async function createPromotionAction(input: PromotionInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").insert({
    title: input.title, description: input.description || null, required_businesses_sold: input.requiredBusinessesSold,
    required_retention_percent: input.requiredRetentionPercent, benefits: input.benefits || null,
    approval_type: input.approvalType, sort_order: input.sortOrder,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/promotions");
  return { success: true };
}

export async function updatePromotionAction(id: string, input: PromotionInput): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").update({
    title: input.title, description: input.description || null, required_businesses_sold: input.requiredBusinessesSold,
    required_retention_percent: input.requiredRetentionPercent, benefits: input.benefits || null,
    approval_type: input.approvalType, sort_order: input.sortOrder,
  }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/promotions");
  return { success: true };
}

export async function deletePromotionAction(id: string): Promise<ActionResult> {
  try { await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin.from("promotions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/promotions");
  return { success: true };
}

/** Approves a pending (admin_approval-type) promotion — this is the only way such a promotion actually takes effect. */
export async function approvePromotionAction(salespersonPromotionId: string, notes: string): Promise<ActionResult> {
  let adminId: string;
  try { adminId = await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { data: record, error } = await admin
    .from("salesperson_promotions")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: adminId, notes: notes || null })
    .eq("id", salespersonPromotionId)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  await admin.from("profiles").update({ current_promotion_id: record.promotion_id }).eq("id", record.salesperson_id);

  revalidatePath("/admin/progression/promotions");
  return { success: true };
}

export async function denyPromotionAction(salespersonPromotionId: string, notes: string): Promise<ActionResult> {
  let adminId: string;
  try { adminId = await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const { error } = await admin
    .from("salesperson_promotions")
    .update({ status: "denied", decided_at: new Date().toISOString(), decided_by: adminId, notes: notes || null })
    .eq("id", salespersonPromotionId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/promotions");
  return { success: true };
}

/** Marks a milestone's reward as approved or paid — separate tracking, not just "unlocked". */
export async function updateMilestoneRewardStatusAction(salespersonMilestoneId: string, status: "approved" | "paid", paymentReference?: string): Promise<ActionResult> {
  let adminId: string;
  try { adminId = await requireAdmin(); } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Not authorized." }; }

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { reward_status: status };
  if (status === "approved") { patch.approved_by = adminId; patch.approved_at = new Date().toISOString(); }
  if (status === "paid") { patch.paid_at = new Date().toISOString(); if (paymentReference) patch.payment_reference = paymentReference; }

  const { error } = await admin.from("salesperson_milestones").update(patch).eq("id", salespersonMilestoneId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/progression/milestones");
  return { success: true };
}
