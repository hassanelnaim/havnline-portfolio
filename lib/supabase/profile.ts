import { createClient } from "@/lib/supabase/server";
import type { DbProfile } from "@/lib/database/types";

export async function getCurrentProfile(): Promise<DbProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
}
