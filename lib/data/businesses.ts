import { createClient } from "@/lib/supabase/server";
import type { DbBusiness, PipelineStatus } from "@/lib/database/types";

/** Admin: every business in the system. */
export async function getAllBusinesses(): Promise<DbBusiness[]> {
  const supabase = createClient();
  const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
  return data || [];
}

/** Salesperson: only businesses assigned to the current user — enforced additionally by RLS regardless. */
export async function getMyBusinesses(userId: string): Promise<DbBusiness[]> {
  const supabase = createClient();
  const { data } = await supabase.from("businesses").select("*").eq("assigned_to", userId).order("created_at", { ascending: false });
  return data || [];
}

export async function getBusiness(id: string): Promise<DbBusiness | null> {
  const supabase = createClient();
  const { data } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getUnassignedBusinesses(): Promise<DbBusiness[]> {
  const supabase = createClient();
  const { data } = await supabase.from("businesses").select("*").is("assigned_to", null).order("created_at", { ascending: false });
  return data || [];
}

export function countByStatus(businesses: DbBusiness[]): Record<PipelineStatus, number> {
  const counts = {} as Record<PipelineStatus, number>;
  for (const b of businesses) {
    counts[b.status] = (counts[b.status] || 0) + 1;
  }
  return counts;
}
