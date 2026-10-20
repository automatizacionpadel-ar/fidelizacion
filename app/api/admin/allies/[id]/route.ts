import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { allyUpdateSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = allyUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) patch.name = d.name;
  if (d.legalName !== undefined) patch.legal_name = d.legalName;
  if (d.taxId !== undefined) patch.tax_id = d.taxId;
  if (d.contactName !== undefined) patch.contact_name = d.contactName;
  if (d.email !== undefined) patch.email = d.email;
  if (d.phone !== undefined) patch.phone = d.phone;
  if (d.commissionRate !== undefined) patch.commission_rate = d.commissionRate;
  if (d.notes !== undefined) patch.notes = d.notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("allies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Aliado no encontrado." }, { status: 404 });

  await logAdminAction({
    actorUserId: session.user.id,
    action: "ally.update",
    entityType: "ally",
    entityId: id,
    metadata: { fields: Object.keys(patch), name: data.name },
  });

  return NextResponse.json({ ally: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const body = await req.json().catch(() => null);
  const deleteAccount = body?.deleteAccount === true;

  const admin = createAdminClient();
  const { data: ally } = await admin.from("allies").select("*").eq("id", id).maybeSingle();
  if (!ally) return NextResponse.json({ error: "Aliado no encontrado." }, { status: 404 });

  const { count } = await admin
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("ally_id", id);
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `El aliado tiene ${count} cliente(s) asignado(s). Reasignalos antes de eliminarlo.` },
      { status: 409 }
    );
  }

  await logAdminAction({
    actorUserId: session.user.id,
    action: "ally.delete",
    entityType: "ally",
    entityId: id,
    metadata: { name: ally.name, email: ally.email, user_id: ally.user_id },
  });

  if (ally.user_id) {
    await admin.from("user_roles").delete().eq("user_id", ally.user_id).eq("role", "ally");
  }
  const { error } = await admin.from("allies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let accountDeleted = false;
  let warning: string | null = null;
  if (deleteAccount && ally.user_id) {
    const [{ data: platformRole }, { count: ownedBusinesses }] = await Promise.all([
      admin
        .from("user_roles")
        .select("role")
        .eq("user_id", ally.user_id)
        .eq("role", "super_admin")
        .maybeSingle(),
      admin
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", ally.user_id),
    ]);
    if (platformRole || (ownedBusinesses ?? 0) > 0) {
      warning = "El aliado se eliminó, pero su cuenta de acceso se conserva porque tiene un rol de plataforma o negocios propios.";
    } else {
      const { error: authError } = await admin.auth.admin.deleteUser(ally.user_id);
      if (authError) warning = `Aliado eliminado, pero la cuenta de Auth no: ${authError.message}`;
      else accountDeleted = true;
    }
  }

  return NextResponse.json({ ok: true, account_deleted: accountDeleted, warning });
}
