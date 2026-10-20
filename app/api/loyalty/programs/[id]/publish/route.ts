import { NextResponse } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";
import { upsertClass, walletConfigured } from "@/lib/wallet/google";
import { ensureFlatWalletLogo } from "@/lib/wallet/walletLogo";
import { cardLimitMessage, cardLimits } from "@/lib/billing";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
  const { data: program, error } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();
  if (error || !program) return NextResponse.json({ error: "Programa no encontrado." }, { status: 404 });

  if (program.status !== "active") {
    const limits = cardLimits(business.plan);
    const { count: activeCount } = await supabase
      .from("loyalty_programs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active");
    if ((activeCount ?? 0) >= limits.active) {
      return NextResponse.json(
        {
          error: `${cardLimitMessage(business.plan, "active")} Pausá otra tarjeta para activar esta.`,
          limit: "active",
        },
        { status: 403 }
      );
    }
  }

  let google_class_id = program.google_class_id as string | null;
  let wallet_warning: string | null = null;
  if (walletConfigured()) {
    try {
      // Normaliza el logo wallet al publicar: cuadrado 660 fundido sobre el
      // fondo actual (si el negocio cambió el color después de subirlo,
      // igual queda mimetizado y sin borde blanco).
      let walletLogo = program.wallet_logo_url as string | null;
      if (walletLogo) {
        try {
          walletLogo = await ensureFlatWalletLogo(walletLogo, program.background_color, business.id, program.id);
        } catch {
          // Si falla, se publica con el logo tal cual (mejor que bloquear).
        }
      }
      google_class_id = await upsertClass({ ...program, wallet_logo_url: walletLogo }, { issuerName: business.name });
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
