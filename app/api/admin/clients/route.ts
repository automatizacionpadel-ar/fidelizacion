import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/auth/helpers";
import { appUrl } from "@/lib/loyalty/business";
import { clientCreateSchema } from "@/lib/admin/schemas";
import { listAdminClients } from "@/lib/admin/clients";
import { logAdminAction } from "@/lib/admin/audit";

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const url = new URL(req.url);
  try {
    const result = await listAdminClients({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
      allyId: url.searchParams.get("ally") ?? undefined,
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
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origen inválido." }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = clientCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const slug = d.slug ?? slugify(d.name);

  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Ese slug ya está en uso." }, { status: 409 });

  const metadata = { nombre: d.ownerName, negocio: d.name };
  let authUserId: string | null = null;

  if (d.access.mode === "invite") {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(d.ownerEmail, {
      data: metadata,
      redirectTo: `${appUrl()}/auth/continue`,
    });
    if (error || !data.user) {
      const status = error?.message?.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json(
        { error: error?.message ?? "No se pudo invitar al dueño." },
        { status }
      );
    }
    authUserId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: d.ownerEmail,
      password: d.access.password!,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      const status = error?.message?.toLowerCase().includes("already") ? 409 : 400;
      return NextResponse.json(
        { error: error?.message ?? "No se pudo crear la cuenta del dueño." },
        { status }
      );
    }
    authUserId = data.user.id;
  }

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name: d.name,
      slug,
      owner_user_id: authUserId,
      plan: d.plan,
      ally_id: d.allyId ?? null,
      notes: d.notes,
      status: "active",
    })
    .select("*")
    .single();

  if (businessError || !business) {
    await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    const conflict = businessError?.code === "23505" || businessError?.message.includes("slug");
    return NextResponse.json(
      { error: conflict ? "Ese slug ya está en uso." : businessError?.message ?? "No se pudo crear el cliente." },
      { status: conflict ? 409 : 400 }
    );
  }

  await logAdminAction({
    actorUserId: session.user.id,
    action: "client.create",
    entityType: "business",
    entityId: business.id,
    metadata: { name: business.name, slug: business.slug, plan: business.plan, owner_email: d.ownerEmail },
  });

  return NextResponse.json({ client: business }, { status: 201 });
}
