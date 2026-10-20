import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientStatusSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = clientStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const suspended = parsed.data.status === "suspended";
  const { data, error } = await admin
    .from("businesses")
    .update({
      status: parsed.data.status,
      suspended_at: suspended ? new Date().toISOString() : null,
      suspended_reason: suspended ? parsed.data.reason?.trim() ?? "" : "",
      suspended_by: suspended ? session.user.id : null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  await logAdminAction({
    actorUserId: session.user.id,
    action: suspended ? "client.suspend" : "client.resume",
    entityType: "business",
    entityId: id,
    metadata: { name: data.name, slug: data.slug, reason: parsed.data.reason ?? "" },
  });

  return NextResponse.json({ client: data });
}
