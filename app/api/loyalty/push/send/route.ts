import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { sendPushSchema } from "@/lib/push/schemas";
import { sendPush } from "@/lib/push/sender";
import { createAdminClient } from "@/lib/supabase/admin";

// Autenticado: el negocio envía a un cliente o difunde a un programa.
export async function POST(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = sendPushSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Revisá título y mensaje." }, { status: 400 });
  const { card_id, program_id, title, body } = parsed.data;

  const admin = createAdminClient();
  let query = admin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth,card_id,program_id")
    .eq("business_id", business.id);
  if (card_id) query = query.eq("card_id", card_id);
  if (program_id) query = query.eq("program_id", program_id);
  const { data: subs } = await query;
  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "Nadie activó los avisos todavía para ese destino." }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  // Icono grande: logo del negocio. Insignia chica: silueta del sello del
  // programa (endpoint dinámico) o la campanita genérica si no hay sello.
  const programIds = [...new Set(subs.map((s) => s.program_id).filter(Boolean))];
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id,logo_url,stamp_image_url,updated_at")
    .in("id", programIds.length > 0 ? programIds : ["00000000-0000-0000-0000-000000000000"]);
  const logoByProgram = new Map((programs ?? []).map((p) => [p.id, p.logo_url as string | null]));
  const badgeByProgram = new Map(
    (programs ?? []).map((p) => [
      p.id as string,
      (p.stamp_image_url as string | null)
        ? `${origin}/api/loyalty/badge?program_id=${p.id}&v=${new Date(p.updated_at as string).getTime()}`
        : `${origin}/badge.png`,
    ])
  );
  let sent = 0;
  const gone: string[] = [];
  const details: { browser: string; ok: boolean; error?: string }[] = [];
  const domainOf = (endpoint: string) => {
    try {
      const host = new URL(endpoint).hostname;
      if (host.includes("fcm.googleapis.com") || host.includes("googleapis.com")) return "Chrome/Android (FCM)";
      if (host.includes("mozilla.com")) return "Firefox";
      if (host.includes("apple.com")) return "Safari/Apple";
      return host;
    } catch {
      return "?";
    }
  };
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPush(
          s,
          title,
          body,
          `${origin}/t/${await tokenOf(s.card_id)}`,
          logoByProgram.get(s.program_id) ?? null,
          badgeByProgram.get(s.program_id) ?? `${origin}/badge.png`
        );
        sent += 1;
        details.push({ browser: domainOf(s.endpoint), ok: true });
      } catch (e: unknown) {
        // 410 Gone = suscripción vencida → limpiar. El resto se reporta
        // (ej. 401 = claves VAPID rotadas) y queda en los logs de Vercel.
        const status = (e as { statusCode?: number }).statusCode;
        const msg = e instanceof Error ? e.message : "Error de envío.";
        console.error(`[push] fallo envío a ${domainOf(s.endpoint)}: status=${status} ${msg}`);
        if (status === 410) gone.push(s.endpoint);
        details.push({ browser: domainOf(s.endpoint), ok: false, error: `push service ${status ?? "?"}: ${msg.slice(0, 120)}` });
      }
    })
  );
  if (gone.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", gone);
  }
  return NextResponse.json({ ok: true, sent, total: subs.length, details });
}

async function tokenOf(cardId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("loyalty_cards").select("token").eq("id", cardId).single();
  return data?.token ?? "";
}
