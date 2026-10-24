import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrollSchema } from "@/lib/loyalty/schemas";
import { normalizePhoneAR } from "@/lib/auth/helpers";
import { createSaveLink } from "@/lib/wallet/google";
import { refreshCardHeroImage } from "@/lib/wallet/cardHero";
import { cardUrl } from "@/lib/loyalty/business";
import { notifyN8n } from "@/lib/loyalty/notify";
import { deviceCookieName, deviceCookieOptions } from "@/lib/loyalty/device";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const admin = createAdminClient();

  // Rate limit atómico en DB: 20 altas por minuto por IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    const { data: allowed } = await admin.rpc("rate_limit_hit", {
      p_key: `enroll:${ip}`,
      p_limit: 20,
      p_window_seconds: 60,
    });
    if (allowed === false) {
      return NextResponse.json({ error: "Demasiados intentos. Esperá un minuto." }, { status: 429 });
    }
  }

  const json = await req.json().catch(() => null);
  const parsed = enrollSchema.safeParse(json);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ error: "Revisá los datos e intentá de nuevo." }, { status: 400 });
  }
  const { slug, name, email, card_token } = parsed.data;

  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id,business_id,status,card_title,card_type,goal,stamp_icon,stamp_image_url,reward_description,background_color,text_color,accent_color,hero_image_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!program || program.status !== "active")
    return NextResponse.json({ error: "Esta tarjeta no está disponible ahora." }, { status: 404 });

  const { data: businessStatus } = await admin
    .from("businesses")
    .select("status")
    .eq("id", program.business_id)
    .maybeSingle();
  if (businessStatus?.status === "suspended")
    return NextResponse.json({ error: "La cuenta del negocio está suspendida." }, { status: 403 });

  // Resolver miembro: por tarjeta existente del mismo negocio (sin datos)
  // o por teléfono (registrado o nuevo).
  let memberId: string;
  let memberName: string;
  if (card_token) {
    const { data: ref } = await admin
      .from("loyalty_cards")
      .select("member_id,business_id,loyalty_members!inner(name)")
      .eq("token", card_token)
      .maybeSingle();
    const members = ref?.loyalty_members as unknown as { name: string } | { name: string }[] | null;
    const refName = Array.isArray(members) ? members[0]?.name : members?.name;
    if (!ref || ref.business_id !== program.business_id || !refName) {
      return NextResponse.json({ error: "No pudimos identificarte. Registrate con tus datos." }, { status: 404 });
    }
    memberId = ref.member_id;
    memberName = refName;
  } else {
    const phone = normalizePhoneAR(parsed.data.phone ?? "");
    if (phone.length < 8) return NextResponse.json({ error: "El teléfono no parece válido." }, { status: 400 });
    const { data: existing } = await admin
      .from("loyalty_members")
      .select("id,name")
      .eq("business_id", program.business_id)
      .eq("phone", phone)
      .maybeSingle();
    if (existing) {
      memberId = existing.id;
      memberName = existing.name;
      // Solo actualizar lo que vino (no pisar email con null en el atajo por teléfono).
      const patch: { name?: string; email?: string | null } = {};
      if (name) patch.name = name;
      if (email !== undefined) patch.email = email;
      if (Object.keys(patch).length > 0) {
        await admin.from("loyalty_members").update(patch).eq("id", memberId);
        if (patch.name) memberName = patch.name;
      }
    } else {
      if (!name) return NextResponse.json({ error: "Contanos tu nombre para registrarte." }, { status: 400 });
      const { data: created, error } = await admin
        .from("loyalty_members")
        .insert({ business_id: program.business_id, name, phone, email: email ?? null })
        .select("id")
        .single();
      if (error || !created) return NextResponse.json({ error: "No pudimos registrarte. Probá de nuevo." }, { status: 400 });
      memberId = created.id;
      memberName = name;
    }
  }

  // Tarjeta existente o nueva
  let card;
  const { data: existingCard } = await admin
    .from("loyalty_cards")
    .select("*")
    .eq("program_id", program.id)
    .eq("member_id", memberId)
    .maybeSingle();
  if (existingCard) {
    card = existingCard;
  } else {
    const token = randomBytes(32).toString("base64url");
    const { data: created, error } = await admin
      .from("loyalty_cards")
      .insert({ program_id: program.id, member_id: memberId, business_id: program.business_id, token })
      .select("*")
      .single();
    if (error || !created) return NextResponse.json({ error: "No pudimos crear tu tarjeta." }, { status: 400 });
    card = created;
  }

  // Hero dinámica por tarjeta (un archivo que se sobrescribe por sellado).
  // Si falla, el link igual se crea con la hero de la clase como fallback.
  const cardHeroUrl = await refreshCardHeroImage({
    cardId: card.id,
    backgroundColor: program.background_color,
    textColor: program.text_color,
    accentColor: program.accent_color,
    cardTitle: program.card_title,
    cardType: program.card_type,
    goal: program.goal,
    balance: card.balance,
    rewardsAvailable: card.rewards_available,
    rewardDescription: program.reward_description,
    stampImageUrl: program.stamp_image_url,
    baseHeroUrl: program.hero_image_url,
  }).catch(() => null);

  const wallet_link = await createSaveLink({
    id: card.id,
    program_id: card.program_id,
    balance: card.balance,
    rewards_available: card.rewards_available,
    token: card.token,
    member_name: memberName,
    goal: program.goal,
    stamp_icon: program.stamp_icon,
    hero_image_url: cardHeroUrl,
  }).catch(() => null);

  notifyN8n("enroll", { business_id: program.business_id, program_id: program.id, card_id: card.id });
  const origin = new URL(req.url).origin;
  const response = NextResponse.json({ card_token: card.token, card_url: cardUrl(card.token, origin), wallet_link });
  // Identificador de dispositivo: en la próxima visita a /n el sello se suma solo.
  response.cookies.set(deviceCookieName(program.id), card.token, deviceCookieOptions());
  return response;
}
