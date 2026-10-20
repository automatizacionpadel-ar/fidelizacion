import { NextResponse, after } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";
import { earnSchema } from "@/lib/loyalty/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateObject } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";
import { notifyN8n } from "@/lib/loyalty/notify";

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
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

  // Sync Wallet diferido con after(): corre después de responder, así Vercel
  // no congela la función a mitad del trabajo (regenerar hero + PATCH).
  // Si algo falla, la tarjeta queda con pending_sync=true para reintentar.
  const admin = createAdminClient();
  const { data: full } = await admin.from("loyalty_cards").select("*").eq("id", cardId).single();
  if (full) {
    const { data: prog } = await admin
      .from("loyalty_programs")
      .select("goal,stamp_icon,stamp_image_url,card_title,card_type,reward_description,background_color,text_color,accent_color,hero_image_url")
      .eq("id", full.program_id)
      .maybeSingle();
    const snapshot = { full, prog };
    after(() =>
      refreshCardHeroImage({
        cardId: snapshot.full.id,
        backgroundColor: snapshot.prog?.background_color ?? null,
        textColor: snapshot.prog?.text_color ?? null,
        accentColor: snapshot.prog?.accent_color ?? null,
        cardTitle: snapshot.prog?.card_title ?? "",
        cardType: snapshot.prog?.card_type ?? "stamps",
        goal: snapshot.prog?.goal ?? 0,
        balance: snapshot.full.balance,
        rewardsAvailable: snapshot.full.rewards_available,
        rewardDescription: snapshot.prog?.reward_description ?? null,
        stampImageUrl: snapshot.prog?.stamp_image_url ?? null,
        baseHeroUrl: snapshot.prog?.hero_image_url ?? null,
      })
        .catch(() => null)
        .then((heroUrl) =>
          updateObject({
            id: snapshot.full.id, program_id: snapshot.full.program_id, balance: snapshot.full.balance,
            rewards_available: snapshot.full.rewards_available, token: snapshot.full.token,
            goal: snapshot.prog?.goal ?? null, stamp_icon: snapshot.prog?.stamp_icon ?? null,
            hero_image_url: heroUrl,
          })
        )
        .then(() => admin.from("loyalty_cards").update({ pending_sync: false }).eq("id", snapshot.full.id))
        .catch(() => {})
    );
  }
  notifyN8n("earn", { business_id: business.id, card_id: cardId, ...result });
  return NextResponse.json(result);
}
