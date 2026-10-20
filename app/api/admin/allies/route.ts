import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/loyalty/business";
import { allyCreateSchema } from "@/lib/admin/schemas";
import { listAdminAllies } from "@/lib/admin/allies";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";

export async function GET(req: Request) {
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const url = new URL(req.url);
  try {
    const result = await listAdminAllies({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1") || 1,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = allyCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const name = d.name?.trim() || d.contactName.trim() || d.email.split("@")[0];
  const admin = createAdminClient();
  const metadata = { nombre: d.contactName || name, aliado: name };
  let authUserId: string;

  if (d.access.mode === "invite") {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(d.email, {
      data: metadata,
      redirectTo: `${appUrl()}/auth/continue`,
    });
    if (error || !data.user) {
      const status = error?.message?.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json({ error: error?.message ?? "No se pudo invitar al aliado." }, { status });
    }
    authUserId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: d.email,
      password: d.access.password!,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      const status = error?.message?.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json({ error: error?.message ?? "No se pudo crear la cuenta del aliado." }, { status });
    }
    authUserId = data.user.id;
  }

  const { data: ally, error: allyError } = await admin
    .from("allies")
    .insert({
      user_id: authUserId,
      name,
      legal_name: d.legalName,
      tax_id: d.taxId,
      contact_name: d.contactName,
      email: d.email,
      phone: d.phone,
      commission_rate: d.commissionRate,
      notes: d.notes,
      status: "active",
    })
    .select("*")
    .single();

  if (allyError || !ally) {
    await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    return NextResponse.json({ error: allyError?.message ?? "No se pudo crear el aliado." }, { status: 400 });
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: authUserId, role: "ally" });
  if (roleError) {
    await admin.from("allies").delete().eq("id", ally.id);
    await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    return NextResponse.json({ error: "No se pudo asignar el rol de aliado." }, { status: 400 });
  }

  await logAdminAction({
    actorUserId: session.user.id,
    action: "ally.create",
    entityType: "ally",
    entityId: ally.id,
    metadata: { name: ally.name, email: ally.email, commission_rate: ally.commission_rate },
  });

  return NextResponse.json({ ally }, { status: 201 });
}
