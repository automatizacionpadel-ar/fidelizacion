import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReferralAlly = { id: string; name: string };

export function normalizeAllyId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return UUID_RE.test(id) ? id : null;
}

export async function getActiveReferralAlly(id: string | null): Promise<ReferralAlly | null> {
  if (!id) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("allies")
      .select("id,name")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();
    return (data as ReferralAlly | null) ?? null;
  } catch {
    return null;
  }
}

export async function resolveReferralFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): Promise<ReferralAlly | null> {
  return getActiveReferralAlly(normalizeAllyId(metadata?.aliado_id));
}
