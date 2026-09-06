import { createClient } from "@/lib/supabase/server";
import type { DbProfile } from "@/lib/database/types";

export async function getAllSalespeople(): Promise<DbProfile[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("role", "salesperson").order("created_at", { ascending: false });
  return data || [];
}

export async function getProfile(id: string): Promise<DbProfile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}
