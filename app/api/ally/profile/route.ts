import { NextResponse } from "next/server";
import { z } from "zod";
import { getAlly } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/admin/http";

const profileSchema = z.object({
  contactName: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
  legalName: z.string().max(120).optional(),
  taxId: z.string().max(30).optional(),
});

export async function PATCH(req: Request) {
  const session = await getAlly();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (session.ally.status === "suspended") {
    return NextResponse.json({ error: "Tu cuenta de aliado está suspendida." }, { status: 403 });
  }
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.contactName !== undefined) patch.contact_name = parsed.data.contactName;
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone;
  if (parsed.data.legalName !== undefined) patch.legal_name = parsed.data.legalName;
  if (parsed.data.taxId !== undefined) patch.tax_id = parsed.data.taxId;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allies")
    .update(patch)
    .eq("id", session.ally.id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Aliado no encontrado." }, { status: 404 });

  return NextResponse.json({ ally: data });
}
