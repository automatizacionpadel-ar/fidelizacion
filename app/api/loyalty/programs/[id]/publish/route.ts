import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { upsertClass, walletConfigured } from "@/lib/wallet/google";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: program, error } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();
  if (error || !program) return NextResponse.json({ error: "Programa no encontrado." }, { status: 404 });

  let google_class_id = program.google_class_id as string | null;
  let wallet_warning: string | null = null;
  if (walletConfigured()) {
    try {
      google_class_id = await upsertClass(program);
    } catch (e) {
      wallet_warning = e instanceof Error ? e.message : "Wallet falló; igual se activa el programa.";
    }
  } else {
    wallet_warning = "Google Wallet no configurado: el programa se activa igual y la tarjeta web funciona.";
  }

  const { data: updated, error: upErr } = await supabase
    .from("loyalty_programs")
    .update({ status: "active", google_class_id })
    .eq("id", id)
    .eq("business_id", business.id)
    .select("*")
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
  return NextResponse.json({ program: updated, wallet_warning });
}
