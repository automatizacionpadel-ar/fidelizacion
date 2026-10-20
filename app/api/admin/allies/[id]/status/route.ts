import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { allyStatusSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = allyStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allies")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Aliado no encontrado." }, { status: 404 });

  await logAdminAction({
    actorUserId: session.user.id,
    action: parsed.data.status === "suspended" ? "ally.suspend" : "ally.resume",
    entityType: "ally",
    entityId: id,
    metadata: { name: data.name, reason: parsed.data.reason ?? "" },
  });

  return NextResponse.json({ ally: data });
}
