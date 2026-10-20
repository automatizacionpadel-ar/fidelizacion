import { NextResponse } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";
import { programSchema } from "@/lib/loyalty/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
  const json = await req.json().catch(() => null);
  const parsed = programSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  // El estado solo cambia por /publish o /pause, para poder aplicar los límites del plan.
  const fields = { ...parsed.data };
  delete fields.status;
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("loyalty_programs")
    .update(fields)
    .eq("id", id)
    .eq("business_id", business.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ program: data });
}

// Elimina un programa COMPLETO: fila (la DB borra en cascada tarjetas,
// transacciones y suscripciones push) + archivos del bucket (logos, heroes,
// sellos, logo wallet y heroes generadas por tarjeta).
// Los miembros del negocio se conservan (pueden tener otras tarjetas).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("id,logo_url,wallet_logo_url,hero_image_url,stamp_image_url")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!program) return NextResponse.json({ error: "Tarjeta no encontrada." }, { status: 404 });

  const admin = createAdminClient();
  const { data: cards } = await admin.from("loyalty_cards").select("id").eq("program_id", id);

  // Rutas dentro del bucket "logos" a partir de URLs públicas.
  const paths = new Set<string>();
  const pushPath = (url: unknown) => {
    if (typeof url !== "string") return;
    const i = url.indexOf("/logos/");
    if (i >= 0) {
      const p = url.slice(i + "/logos/".length).split("?")[0];
      if (p) paths.add(p);
    }
  };
  pushPath(program.logo_url);
  pushPath(program.wallet_logo_url);
  pushPath(program.hero_image_url);
  pushPath(program.stamp_image_url);
  paths.add(`wallet-logos/${id}.png`);
  for (const c of cards ?? []) paths.add(`cards/${(c as { id: string }).id}.png`);

  if (paths.size > 0) {
    // Best-effort: si el storage falla, igual se sigue con la DB.
    await admin.storage.from("logos").remove([...paths]).catch(() => {});
  }
  const { error } = await admin.from("loyalty_programs").delete().eq("id", id).eq("business_id", business.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, files: paths.size });
}
