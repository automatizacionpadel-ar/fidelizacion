import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientDeleteSchema, clientUpdateSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { collectBusinessFilePaths, removeBusinessReceipts, removeStoragePaths } from "@/lib/admin/storage";
import { assertSameOrigin } from "@/lib/admin/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = clientUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (parsed.data.slug) {
    const { data: existing } = await admin
      .from("businesses")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Ese slug ya está en uso." }, { status: 409 });
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.slug !== undefined) patch.slug = parsed.data.slug;
  if (parsed.data.plan !== undefined) patch.plan = parsed.data.plan;
  if (parsed.data.allyId !== undefined) patch.ally_id = parsed.data.allyId;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("businesses")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "Ese slug ya está en uso." : error.message },
      { status: conflict ? 409 : 400 }
    );
  }
  if (!data) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  await logAdminAction({
    actorUserId: session.user.id,
    action: "client.update",
    entityType: "business",
    entityId: id,
    metadata: { fields: Object.keys(patch), name: data.name, slug: data.slug },
  });

  return NextResponse.json({ client: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = clientDeleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta la confirmación del slug." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id,name,slug,owner_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  if (business.slug !== parsed.data.confirmSlug.trim()) {
    return NextResponse.json({ error: "El slug no coincide. No se eliminó nada." }, { status: 400 });
  }

  const files = await collectBusinessFilePaths(id);

  // RPC con la sesión del usuario para que auth.uid() funcione dentro del guard.
  const { data: result, error } = await session.supabase.rpc("admin_delete_business", {
    p_business_id: id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const rpc = result as { ok?: boolean; error?: string; owner_user_id?: string };
  if (!rpc?.ok) return NextResponse.json({ error: rpc?.error ?? "No se pudo eliminar." }, { status: 400 });

  const [filesRemoved, receiptsRemoved] = await Promise.all([
    removeStoragePaths(files),
    removeBusinessReceipts(id),
  ]);

  let accountDeleted = false;
  let warning: string | null = null;
  if (parsed.data.deleteOwnerAccount && business.owner_user_id) {
    const { count } = await admin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", business.owner_user_id);
    if ((count ?? 0) === 0) {
      const { data: platformRole } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", business.owner_user_id)
        .maybeSingle();
      if (platformRole) {
        warning = "El cliente se eliminó, pero la cuenta tiene un rol de plataforma y no se borró.";
      } else {
        const { error: authError } = await admin.auth.admin.deleteUser(business.owner_user_id);
        if (authError) warning = `El cliente se eliminó, pero la cuenta de Auth no: ${authError.message}`;
        else accountDeleted = true;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    files_removed: filesRemoved,
    receipts_removed: receiptsRemoved,
    account_deleted: accountDeleted,
    warning,
  });
}
