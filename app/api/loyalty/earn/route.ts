import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { earnSchema } from "@/lib/loyalty/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateObject } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";
import { notifyN8n } from "@/lib/loyalty/notify";

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = earnSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { card_id, token, amount_spent, source, note } = parsed.data;

  // Resolver tarjeta por card_id o token, siempre dentro del negocio
  let cardId = card_id ?? null;
  if (!cardId && token) {
    const { data: card } = await supabase
      .from("loyalty_cards")
      .select("id")
      .eq("token", token)
      .eq("business_id", business.id)
      .maybeSingle();
    cardId = card?.id ?? null;
  }
  if (!cardId) return NextResponse.json({ error: "Tarjeta no válida o de otro negocio." }, { status: 404 });

  const { data, error } = await supabase.rpc("loyalty_earn", {
    p_card_id: cardId,
    p_amount_spent: amount_spent ?? null,
    p_source: source,
    p_note: note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = data as { ok: boolean; error?: string; [k: string]: unknown };
  if (!result?.ok) return NextResponse.json({ error: result?.error ?? "No se pudo sumar." }, { status: 400 });

  // Sync Wallet en background (no bloquea ni revierte):
  // se regenera la hero de la tarjeta (mismo archivo, sobrescribe) y se
  // actualiza el objeto con el progreso. Si algo falla, queda pending_sync.
  const admin = createAdminClient();
  const { data: full } = await admin.from("loyalty_cards").select("*").eq("id", cardId).single();
  if (full) {
    const { data: prog } = await admin
      .from("loyalty_programs")
      .select("goal,stamp_icon,stamp_image_url,card_title,card_type,reward_description,background_color,text_color,accent_color,hero_image_url")
      .eq("id", full.program_id)
      .maybeSingle();
    refreshCardHeroImage({
      cardId: full.id,
      backgroundColor: prog?.background_color ?? null,
      textColor: prog?.text_color ?? null,
      accentColor: prog?.accent_color ?? null,
      cardTitle: prog?.card_title ?? "",
      cardType: prog?.card_type ?? "stamps",
      goal: prog?.goal ?? 0,
      balance: full.balance,
      rewardsAvailable: full.rewards_available,
      rewardDescription: prog?.reward_description ?? null,
      stampImageUrl: prog?.stamp_image_url ?? null,
      baseHeroUrl: prog?.hero_image_url ?? null,
    })
      .catch(() => null)
      .then((heroUrl) =>
        updateObject({
          id: full.id, program_id: full.program_id, balance: full.balance,
          rewards_available: full.rewards_available, token: full.token,
          goal: prog?.goal ?? null, stamp_icon: prog?.stamp_icon ?? null,
          hero_image_url: heroUrl,
        })
      )
      .then(() => admin.from("loyalty_cards").update({ pending_sync: false }).eq("id", full.id))
      .catch(() => {});
  }
  notifyN8n("earn", { business_id: business.id, card_id: cardId, ...result });
  return NextResponse.json(result);
}
