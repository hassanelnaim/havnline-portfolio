import { createClient } from "@/lib/supabase/server";
import type { DbActivityLog } from "@/lib/database/types";

export async function getActivityForBusiness(businessId: string): Promise<DbActivityLog[]> {
  const supabase = createClient();
  const { data } = await supabase.from("activity_log").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
  return data || [];
}
