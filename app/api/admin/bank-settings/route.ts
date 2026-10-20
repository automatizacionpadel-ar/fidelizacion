import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { bankSettingsSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";
import { normalizeBankSettings } from "@/lib/bank-settings";

export async function PUT(req: Request) {
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = bankSettingsSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bank_transfer_settings")
    .upsert(
      {
        id: 1,
        holder: parsed.data.holder,
        bank: parsed.data.bank,
        account_type: parsed.data.accountType,
        cbu_cvu: parsed.data.cbuCvu,
        alias: parsed.data.alias,
        tax_id: parsed.data.taxId,
        notes: parsed.data.notes,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();
  if (error) {
    const missing = error.message.includes("bank_transfer_settings") || error.message.includes("schema cache");
    return NextResponse.json(
      { error: missing ? "Falta aplicar la migración 021_bank_transfer_settings.sql." : error.message },
      { status: 400 }
    );
  }

  await logAdminAction({
    actorUserId: session.user.id,
    action: "settings.bank_update",
    entityType: "settings",
    entityId: null,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ settings: normalizeBankSettings(data) });
}
