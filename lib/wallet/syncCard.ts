// Re-sincroniza el pase de Google Wallet de una tarjeta: regenera la hero con
// el progreso actual y aplica el PATCH del objeto. Best-effort: si el PATCH
// falla, la tarjeta queda con pending_sync=true para reintentar después.
import { createAdminClient } from "@/lib/supabase/admin";
import { updateObject } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";

export async function syncCardWallet(cardId: string) {
  const admin = createAdminClient();
  const { data: full } = await admin.from("loyalty_cards").select("*").eq("id", cardId).single();
  if (!full) return;
  const { data: prog } = await admin
    .from("loyalty_programs")
    .select("goal,stamp_icon,stamp_image_url,card_title,card_type,reward_description,background_color,text_color,accent_color,hero_image_url")
    .eq("id", full.program_id)
    .maybeSingle();

  try {
    const heroUrl = await refreshCardHeroImage({
      cardId: full.id,
      backgroundColor: prog?.background_color ?? null,
      textColor: prog?.text_color ?? null,
      accentColor: prog?.accent_color ?? null,
      cardTitle: prog?.card_title ?? "",
      cardType: (prog?.card_type ?? "stamps") as "stamps" | "points",
      goal: prog?.goal ?? 0,
      balance: full.balance,
      rewardsAvailable: full.rewards_available,
      rewardDescription: prog?.reward_description ?? null,
      stampImageUrl: prog?.stamp_image_url ?? null,
      baseHeroUrl: prog?.hero_image_url ?? null,
    }).catch(() => null);

    await updateObject({
      id: full.id,
      program_id: full.program_id,
      balance: full.balance,
      rewards_available: full.rewards_available,
      token: full.token,
      goal: prog?.goal ?? null,
      stamp_icon: prog?.stamp_icon ?? null,
      hero_image_url: heroUrl,
    });

    await admin.from("loyalty_cards").update({ pending_sync: false }).eq("id", full.id);
  } catch {
    // Wallet no disponible o falló: queda pending_sync=true para reintentar.
  }
}
