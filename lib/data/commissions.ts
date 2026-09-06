import { createClient } from "@/lib/supabase/server";
import type { DbCommission } from "@/lib/database/types";

export async function getAllCommissions(): Promise<DbCommission[]> {
  const supabase = createClient();
  const { data } = await supabase.from("commissions").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getMyCommissions(salespersonId: string): Promise<DbCommission[]> {
  const supabase = createClient();
  const { data } = await supabase.from("commissions").select("*").eq("salesperson_id", salespersonId).order("created_at", { ascending: false });
  return data || [];
}

export function summarizeCommissions(commissions: DbCommission[]) {
  const pending = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0);
  const paid = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
  return { pending, paid, lifetime: pending + paid };
}
