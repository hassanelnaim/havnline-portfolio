"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionResult {
  success: boolean;
  error?: string;
  tempPassword?: string;
}

async function requireAdmin(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can do this.");
}

/**
 * Admins create salesperson accounts directly — no public signup for
 * this internal tool. Generates a random temporary password the admin
 * shares with the new salesperson, who should change it on first login.
 */
export async function createSalespersonAction(input: { fullName: string; email: string; phone: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  if (!input.fullName.trim() || !input.email.trim()) {
    return { success: false, error: "Name and email are required." };
  }

  const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return { success: false, error: authError?.message || "Could not create account." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    email: input.email,
    full_name: input.fullName,
    role: "salesperson",
    phone: input.phone || null,
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  revalidatePath("/admin/salespeople");
  return { success: true, tempPassword };
}

export async function deactivateSalespersonAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/salespeople");
  return { success: true };
}

export async function reactivateSalespersonAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: true }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/salespeople");
  return { success: true };
}

/** Updates a salesperson's own profile details — name and phone. Their email/login itself isn't changed here (that's a separate, more sensitive action). */
export async function updateSalespersonAction(id: string, input: { fullName: string; phone: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  if (!input.fullName.trim()) return { success: false, error: "Name is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ full_name: input.fullName, phone: input.phone || null }).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/salespeople");
  return { success: true };
}

/**
 * Generates a fresh temporary password and sets it directly on the
 * salesperson's real login — for when they've forgotten their
 * password or an admin wants to reset access. Shown once, same as
 * account creation.
 */
export async function resetSalespersonPasswordAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!";

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: tempPassword });
  if (error) return { success: false, error: error.message };

  return { success: true, tempPassword };
}
