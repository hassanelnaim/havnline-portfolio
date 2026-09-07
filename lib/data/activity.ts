import { createClient } from "@/lib/supabase/server";
import type { DbActivityLog } from "@/lib/database/types";

export async function getActivityForBusiness(businessId: string): Promise<DbActivityLog[]> {
  const supabase = createClient();
  const { data } = await supabase.from("activity_log").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
  return data || [];
}

/** Recent activity across the WHOLE company, most recent first — real content for the Admin Overview page, not decoration. */
export async function getRecentActivityCompanyWide(limit: number = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("*, businesses(business_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}
