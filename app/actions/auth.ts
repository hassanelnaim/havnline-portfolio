"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message || "Could not log in.")}`);
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();

  if (profileError || !profile) {
    redirect(`/login?error=${encodeURIComponent("Your login worked, but no profile was found for this account. Contact your admin.")}`);
  }

  redirect(profile.role === "admin" ? "/admin" : "/sales");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
