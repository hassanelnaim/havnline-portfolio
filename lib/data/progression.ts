import { createClient } from "@/lib/supabase/server";
import type { DbRank, DbMilestone, DbSalespersonMilestone, DbPromotion, DbSalespersonPromotion } from "@/lib/database/types";

export async function getAllRanks(): Promise<DbRank[]> {
  const supabase = createClient();
  const { data } = await supabase.from("ranks").select("*").order("sort_order", { ascending: true });
  return data || [];
}

export async function getAllMilestones(): Promise<DbMilestone[]> {
  const supabase = createClient();
  const { data } = await supabase.from("milestones").select("*").order("sort_order", { ascending: true });
  return data || [];
}

export async function getUnlockedMilestones(salespersonId: string): Promise<DbSalespersonMilestone[]> {
  const supabase = createClient();
  const { data } = await supabase.from("salesperson_milestones").select("*").eq("salesperson_id", salespersonId).order("unlocked_at", { ascending: false });
  return data || [];
}

export async function getAllPromotions(): Promise<DbPromotion[]> {
  const supabase = createClient();
  const { data } = await supabase.from("promotions").select("*").order("required_businesses_sold", { ascending: true });
  return data || [];
}

export async function getSalespersonPromotionHistory(salespersonId: string): Promise<DbSalespersonPromotion[]> {
  const supabase = createClient();
  const { data } = await supabase.from("salesperson_promotions").select("*").eq("salesperson_id", salespersonId).order("requested_at", { ascending: false });
  return data || [];
}

export async function getPendingPromotionApprovals(): Promise<DbSalespersonPromotion[]> {
  const supabase = createClient();
  const { data } = await supabase.from("salesperson_promotions").select("*").eq("status", "eligible").order("requested_at", { ascending: true });
  return data || [];
}
