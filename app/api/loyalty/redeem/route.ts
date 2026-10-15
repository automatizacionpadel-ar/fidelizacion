import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { redeemSchema } from "@/lib/loyalty/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateObject } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";
import { notifyN8n } from "@/lib/loyalty/notify";

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = redeemSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  let cardId = parsed.data.card_id ?? null;
  if (!cardId && parsed.data.token) {
    const { data } = await supabase
      .from("loyalty_cards")
      .select("id")
      .eq("token", parsed.data.token)
      .eq("business_id", business.id)
      .maybeSingle();
    cardId = data?.id ?? null;
  }
  if (!cardId) return NextResponse.json({ error: "Tarjeta no válida." }, { status: 404 });

  const { data, error } = await supabase.rpc("loyalty_redeem", {
    p_card_id: cardId,
    p_source: parsed.data.source,
    p_note: parsed.data.note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = data as { ok: boolean; error?: string; [k: string]: unknown };
  if (!result?.ok) return NextResponse.json({ error: result?.error ?? "No se pudo canjear." }, { status: 400 });

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
  notifyN8n("redeem", { business_id: business.id, card_id: cardId });
  return NextResponse.json(result);
}
