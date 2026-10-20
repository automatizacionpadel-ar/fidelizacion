import { NextResponse } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateObject } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";

// Re-sync forzado de una tarjeta con Google Wallet: regenera la hero
// (mismo archivo, sobrescribe) y hace PATCH del objeto. A diferencia del
// sync automático del escaneo, acá se espera el resultado y se devuelve
// el error real si algo falla (sirve para diagnosticar).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;

  const { data: card } = await supabase.from("loyalty_cards").select("*").eq("id", id).maybeSingle();
  if (!card || card.business_id !== business.id) {
    return NextResponse.json({ error: "Tarjeta no válida o de otro negocio." }, { status: 404 });
  }
  const admin = createAdminClient();
  const { data: prog } = await admin
    .from("loyalty_programs")
    .select("goal,stamp_icon,stamp_image_url,card_title,card_type,reward_description,background_color,text_color,accent_color,hero_image_url")
    .eq("id", card.program_id)
    .maybeSingle();

  try {
    const heroUrl = await refreshCardHeroImage({
      cardId: card.id,
      backgroundColor: prog?.background_color ?? null,
      textColor: prog?.text_color ?? null,
      accentColor: prog?.accent_color ?? null,
      cardTitle: prog?.card_title ?? "",
      cardType: prog?.card_type ?? "stamps",
      goal: prog?.goal ?? 0,
      balance: card.balance,
      rewardsAvailable: card.rewards_available,
      rewardDescription: prog?.reward_description ?? null,
      stampImageUrl: prog?.stamp_image_url ?? null,
      baseHeroUrl: prog?.hero_image_url ?? null,
    });
    await updateObject({
      id: card.id, program_id: card.program_id, balance: card.balance,
      rewards_available: card.rewards_available, token: card.token,
      goal: prog?.goal ?? null, stamp_icon: prog?.stamp_icon ?? null,
      hero_image_url: heroUrl,
    });
    await admin.from("loyalty_cards").update({ pending_sync: false }).eq("id", card.id);
    return NextResponse.json({ ok: true, hero_url: heroUrl });
  } catch (e) {
    await admin.from("loyalty_cards").update({ pending_sync: true }).eq("id", card.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falló la sincronización." },
      { status: 502 }
    );
  }
}
