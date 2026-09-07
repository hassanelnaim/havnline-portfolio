import { createAdminClient } from "@/lib/supabase/admin";
import type { DbMilestone, DbPromotion, DbRank } from "@/lib/database/types";

/**
 * lib/progression/engine.ts
 *
 * The single source of truth for "how good is this salesperson doing,
 * really" — every number here is computed live from the actual
 * businesses/commissions tables, never a counter a salesperson (or
 * even an admin, accidentally) could edit directly. This is the
 * anti-gaming requirement from the spec: achievements are derived
 * facts, not stored opinions.
 *
 * Key design choice: "businesses sold" (lifetime) counts any business
 * that ever had a first_payment_date set — even if it later cancelled.
 * This matches the spec's explicit rule to never erase historical
 * achievements just because a customer's status changes later.
 * "Active businesses" is the separate, current-standing number.
 */

// Statuses that represent "reached paying customer or further" —
// used only as a display/consistency check, NOT as the actual
// lifetime-sold definition (see comment above).
const CUSTOMER_STAGE_STATUSES = [
  "paying_customer", "commission_1_pending", "commission_1_paid",
  "commission_2_pending", "commission_2_paid", "completed",
];

export interface SalespersonStats {
  businessesSoldLifetime: number;
  activeBusinesses: number;
  commissionEarned: number; // paid only — real, realized earnings
  retentionPercent: number;
  salesThisMonth: number;
  salesThisWeek: number;
}

export async function computeSalespersonStats(salespersonId: string): Promise<SalespersonStats> {
  const admin = createAdminClient();

  const { data: businesses } = await admin
    .from("businesses")
    .select("status, first_payment_date")
    .eq("assigned_to", salespersonId);

  const { data: commissions } = await admin
    .from("commissions")
    .select("amount, status")
    .eq("salesperson_id", salespersonId);

  const rows = businesses || [];
  const everSold = rows.filter((b) => b.first_payment_date !== null);
  const businessesSoldLifetime = everSold.length;
  const activeBusinesses = everSold.filter((b) => b.status !== "cancelled").length;
  const retentionPercent = businessesSoldLifetime > 0 ? (activeBusinesses / businessesSoldLifetime) * 100 : 0;

  const commissionEarned = (commissions || [])
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const salesThisMonth = everSold.filter((b) => b.first_payment_date && new Date(b.first_payment_date) >= startOfMonth).length;
  const salesThisWeek = everSold.filter((b) => b.first_payment_date && new Date(b.first_payment_date) >= startOfWeek).length;

  return { businessesSoldLifetime, activeBusinesses, commissionEarned, retentionPercent, salesThisMonth, salesThisWeek };
}

export interface RankProgress {
  currentRank: DbRank | null;
  nextRank: DbRank | null;
  progressCount: number;
  progressNeeded: number;
  progressPercent: number;
}

/** Determines current rank + progress toward the next one — purely from real lifetime sales count, against admin-configured thresholds. */
export async function computeRankProgress(businessesSoldLifetime: number): Promise<RankProgress> {
  const admin = createAdminClient();
  const { data: ranks } = await admin.from("ranks").select("*").eq("is_active", true).order("sort_order", { ascending: true });

  const sorted = (ranks || []).sort((a, b) => a.min_businesses_sold - b.min_businesses_sold);

  let currentRank: DbRank | null = null;
  let nextRank: DbRank | null = null;

  for (const rank of sorted) {
    if (businessesSoldLifetime >= rank.min_businesses_sold) {
      currentRank = rank;
    } else if (!nextRank) {
      nextRank = rank;
    }
  }

  if (!nextRank) {
    return { currentRank, nextRank: null, progressCount: businessesSoldLifetime, progressNeeded: businessesSoldLifetime, progressPercent: 100 };
  }

  const floor = currentRank?.min_businesses_sold || 0;
  const span = nextRank.min_businesses_sold - floor;
  const progressCount = businessesSoldLifetime - floor;
  const progressPercent = span > 0 ? Math.min(100, Math.round((progressCount / span) * 100)) : 0;

  return { currentRank, nextRank, progressCount, progressNeeded: nextRank.min_businesses_sold, progressPercent };
}

function statForRequirementType(stats: SalespersonStats, type: DbMilestone["requirement_type"]): number {
  switch (type) {
    case "businesses_sold": return stats.businessesSoldLifetime;
    case "active_businesses": return stats.activeBusinesses;
    case "commission_earned": return stats.commissionEarned;
    case "sales_in_month": return stats.salesThisMonth;
    case "sales_in_week": return stats.salesThisWeek;
    case "customer_retention": return stats.retentionPercent;
    // consecutive_sales_weeks, revenue_generated, custom: not computed
    // in this phase — treated as never-met rather than guessed at.
    default: return -1;
  }
}

/**
 * Checks every active milestone against a salesperson's real stats and
 * unlocks (inserts into salesperson_milestones) any newly-qualified
 * ones. Safe to call repeatedly — already-unlocked milestones are
 * skipped via the table's unique constraint. This is what actually
 * gets called after real events (a commission being marked paid, a
 * month completing) — never something the salesperson triggers
 * themselves.
 */
export async function evaluateMilestonesForSalesperson(salespersonId: string): Promise<{ newlyUnlocked: DbMilestone[] }> {
  const admin = createAdminClient();
  const stats = await computeSalespersonStats(salespersonId);

  const { data: milestones } = await admin.from("milestones").select("*").eq("is_active", true);
  const { data: alreadyUnlocked } = await admin.from("salesperson_milestones").select("milestone_id").eq("salesperson_id", salespersonId);
  const unlockedIds = new Set((alreadyUnlocked || []).map((m) => m.milestone_id));

  const newlyUnlocked: DbMilestone[] = [];

  for (const milestone of milestones || []) {
    if (unlockedIds.has(milestone.id)) continue;

    const actual = statForRequirementType(stats, milestone.requirement_type);
    if (actual >= Number(milestone.requirement_value)) {
      const { error } = await admin.from("salesperson_milestones").insert({
        salesperson_id: salespersonId,
        milestone_id: milestone.id,
        reward_amount: milestone.reward_amount,
      });
      if (!error) newlyUnlocked.push(milestone);
    }
  }

  return { newlyUnlocked };
}

/**
 * Checks every active promotion's requirements against real stats.
 * Automatic promotions apply immediately; admin_approval ones create
 * an "eligible" record for an admin to review — never self-approved.
 */
export async function evaluatePromotionsForSalesperson(salespersonId: string): Promise<{ newlyEligible: DbPromotion[] }> {
  const admin = createAdminClient();
  const stats = await computeSalespersonStats(salespersonId);

  const { data: promotions } = await admin.from("promotions").select("*").eq("is_active", true).order("required_businesses_sold", { ascending: true });
  const { data: existingRecords } = await admin.from("salesperson_promotions").select("promotion_id, status").eq("salesperson_id", salespersonId);
  const existingByPromotion = new Map((existingRecords || []).map((r) => [r.promotion_id, r.status]));

  const newlyEligible: DbPromotion[] = [];

  for (const promotion of promotions || []) {
    const existingStatus = existingByPromotion.get(promotion.id);
    if (existingStatus === "approved" || existingStatus === "eligible") continue; // already there or already pending

    const meetsBusinesses = stats.businessesSoldLifetime >= promotion.required_businesses_sold;
    const meetsRetention = promotion.required_retention_percent === null || stats.retentionPercent >= promotion.required_retention_percent;

    if (meetsBusinesses && meetsRetention) {
      if (promotion.approval_type === "automatic") {
        await admin.from("salesperson_promotions").insert({
          salesperson_id: salespersonId,
          promotion_id: promotion.id,
          status: "approved",
          decided_at: new Date().toISOString(),
          requirements_snapshot: stats as any,
        });
        await admin.from("profiles").update({ current_promotion_id: promotion.id }).eq("id", salespersonId);
      } else {
        await admin.from("salesperson_promotions").insert({
          salesperson_id: salespersonId,
          promotion_id: promotion.id,
          status: "eligible",
          requirements_snapshot: stats as any,
        });
      }
      newlyEligible.push(promotion);
    }
  }

  return { newlyEligible };
}

/** Runs the full evaluation pipeline — call this after any real sales event. */
export async function runProgressionEvaluation(salespersonId: string) {
  const milestoneResult = await evaluateMilestonesForSalesperson(salespersonId);
  const promotionResult = await evaluatePromotionsForSalesperson(salespersonId);
  return { ...milestoneResult, ...promotionResult };
}
