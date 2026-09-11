"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/format";
import type { ActionResult } from "./salespeople";

async function requireAdmin(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can do this.");
}

export interface ImportRow {
  business_name: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  contact_name?: string;
  priority?: string;
  source?: string;
}

export interface ImportLeadsResult extends ActionResult {
  imported?: number;
  skippedDuplicates?: number;
}

/**
 * Imports a batch of leads with real duplicate detection: a row is
 * considered a duplicate of an existing business if its normalized
 * phone number matches, OR (when no phone is given) its business name
 * and city both match — this directly implements the spec's
 * requirement that re-importing the same list (e.g. "ABC Dental"
 * appearing again in week 3) never creates a second copy.
 */
export async function importLeadsAction(rows: ImportRow[], batchLabel: string): Promise<ImportLeadsResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin.from("businesses").select("id, normalized_phone, business_name, city");
  const existingPhones = new Set((existing || []).map((b) => b.normalized_phone).filter(Boolean));
  const existingNameCity = new Set((existing || []).map((b) => `${b.business_name.toLowerCase().trim()}|${(b.city || "").toLowerCase().trim()}`));

  let imported = 0;
  let skipped = 0;
  const toInsert = [];

  for (const row of rows) {
    if (!row.business_name?.trim()) continue;

    const normalizedPhone = row.phone ? normalizePhone(row.phone) : null;
    const nameKey = `${row.business_name.toLowerCase().trim()}|${(row.city || "").toLowerCase().trim()}`;

    const isDuplicate = (normalizedPhone && existingPhones.has(normalizedPhone)) || existingNameCity.has(nameKey);

    if (isDuplicate) {
      skipped++;
      continue;
    }

    toInsert.push({
      business_name: row.business_name,
      phone: row.phone || null,
      normalized_phone: normalizedPhone,
      website: row.website || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      industry: row.industry || null,
      contact_name: row.contact_name || null,
      priority: row.priority && ["low", "normal", "high"].includes(row.priority) ? row.priority : "normal",
      source: row.source || null,
      status: "new_lead" as const,
      imported_batch: batchLabel,
    });

    if (normalizedPhone) existingPhones.add(normalizedPhone);
    existingNameCity.add(nameKey);
  }

  if (toInsert.length > 0) {
    const { error } = await admin.from("businesses").insert(toInsert);
    if (error) return { success: false, error: error.message };
    imported = toInsert.length;
  }

  revalidatePath("/admin/leads");
  return { success: true, imported, skippedDuplicates: skipped };
}

export async function assignLeadsAction(businessIds: string[], salespersonId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("businesses").update({ assigned_to: salespersonId }).in("id", businessIds);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/leads");
  return { success: true };
}

/**
 * Real deletion, not a status change — cascading deletes on the
 * schema (businesses → activity_log, businesses → commissions) mean
 * everything tied to these leads is cleaned up automatically, with
 * no orphaned records left behind.
 */
export async function deleteLeadsAction(businessIds: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  if (businessIds.length === 0) return { success: false, error: "No leads selected." };

  const admin = createAdminClient();
  const { error } = await admin.from("businesses").delete().in("id", businessIds);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { success: true };
}
