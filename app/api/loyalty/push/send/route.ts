import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";
import { sendPushSchema } from "@/lib/push/schemas";
import { sendPush } from "@/lib/push/sender";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCardMessage, walletConfigured } from "@/lib/wallet/google";
import type { SupabaseClient } from "@supabase/supabase-js";

// Autenticado: el negocio envía a un cliente o difunde a un programa.
// Wallet = notificación nativa de la app de Google Wallet (llega con Chrome
// cerrado, sin instalar nada; máx. 3 por pase cada 24 h). Push = Web Push.
// Cada envío queda registrado en notification_sends/notification_recipients.
export async function POST(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
  const json = await req.json().catch(() => null);
  const parsed = sendPushSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Revisá título y mensaje." }, { status: 400 });
  const { card_id, program_id, title, body, channel } = parsed.data;

  const admin = createAdminClient();
  const origin = new URL(req.url).origin;
  const wantWallet = channel === "wallet" || channel === "both";
  const wantPush = channel === "push" || channel === "both";

  // Tarjetas del destino + datos del miembro (para registrar destinatarios).
  let cardsQuery = admin
    .from("loyalty_cards")
    .select("id,loyalty_members(name,phone)")
    .eq("business_id", business.id);
  cardsQuery = card_id ? cardsQuery.eq("id", card_id) : cardsQuery.eq("program_id", program_id!);
  const { data: cardsRaw } = await cardsQuery;
  const cards = (cardsRaw ?? []) as unknown as CardRow[];

  // ---- Wallet ----
  let wallet: WalletResult | null = null;
  let walletRecipients: RecipientInsert[] = [];
  if (wantWallet) {
    if (!walletConfigured()) {
      if (channel === "wallet") {
        return NextResponse.json({ error: "Google Wallet no está configurado en el servidor." }, { status: 400 });
      }
    } else {
      if (cards.length === 0 && channel === "wallet") {
        return NextResponse.json({ error: "No hay tarjetas emitidas para ese destino todavía." }, { status: 404 });
      }
      const out = await sendWalletBroadcast(cards, title, body);
      wallet = out.result;
      walletRecipients = out.recipients;
    }
  }

  // ---- Web Push ----
  let push: PushResult | null = null;
  let pushRecipients: RecipientInsert[] = [];
  if (wantPush) {
    let query = admin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,card_id,program_id")
      .eq("business_id", business.id);
    if (card_id) query = query.eq("card_id", card_id);
    if (program_id) query = query.eq("program_id", program_id);
    const { data: subs } = await query;
    if ((!subs || subs.length === 0) && channel === "push") {
      return NextResponse.json({ error: "Nadie activó los avisos en el navegador todavía para ese destino." }, { status: 404 });
    }
    const out = await sendPushBroadcast(admin, subs ?? [], cards, title, body, origin);
    push = out.result;
    pushRecipients = out.recipients;
  }

  // ---- Registrar el envío ----
  // Best-effort: si la migración 012 todavía no se aplicó, el aviso igual se
  // envió; solo no queda en el historial.
  let sendId: string | null = null;
  try {
    const { data: sendRow } = await admin
      .from("notification_sends")
      .insert({
        business_id: business.id,
        program_id: program_id ?? null,
        card_id: card_id ?? null,
        channel,
        title,
        body,
        wallet_sent: wallet?.sent ?? 0,
        wallet_not_saved: wallet?.notSaved ?? 0,
        wallet_quota: wallet?.quota ?? 0,
        wallet_failed: wallet?.failed ?? 0,
        push_sent: push?.sent ?? 0,
        push_total: push?.total ?? 0,
      })
      .select("id")
      .single();
    sendId = (sendRow?.id as string | undefined) ?? null;
    const recipients = [...walletRecipients, ...pushRecipients];
    if (sendId && recipients.length > 0) {
      await admin
        .from("notification_recipients")
        .insert(recipients.map((r) => ({ ...r, send_id: sendId, business_id: business.id })));
    }
  } catch (e) {
    console.error(`[avisos] no se pudo registrar el historial: ${(e as Error).message}`);
  }

  return NextResponse.json({ ok: true, wallet, push, send_id: sendId });
}

type CardRow = { id: string; loyalty_members: { name: string | null; phone: string | null } | null };

type RecipientInsert = {
  card_id: string | null;
  member_name: string | null;
  member_phone: string | null;
  channel: "wallet" | "push";
  status: "sent" | "not_saved" | "quota" | "failed";
};

type WalletResult = {
  configured: boolean;
  sent: number;
  total: number;
  notSaved: number;
  quota: number;
  failed: number;
};

type PushResult = {
  sent: number;
  total: number;
  details: { browser: string; ok: boolean; error?: string }[];
};

async function sendWalletBroadcast(
  cards: CardRow[],
  title: string,
  body: string
): Promise<{ result: WalletResult; recipients: RecipientInsert[] }> {
  const messageId = `aviso-${randomUUID()}`;
  const recipients: RecipientInsert[] = [];
  const result: WalletResult = { configured: true, sent: 0, total: cards.length, notSaved: 0, quota: 0, failed: 0 };

  // Lotes de 5 para no pasarnos del límite de tasa de la API (20 req/s).
  const chunk = 5;
  for (let i = 0; i < cards.length; i += chunk) {
    await Promise.all(
      cards.slice(i, i + chunk).map(async (c) => {
        let status: RecipientInsert["status"] = "failed";
        try {
          await sendCardMessage(c.id, { id: messageId, header: title, body });
          result.sent += 1;
          status = "sent";
        } catch (e) {
          const err = e as { status?: number; quota?: boolean; message?: string };
          if (err.status === 404) {
            result.notSaved += 1;
            status = "not_saved";
          } else if (err.quota) {
            result.quota += 1;
            status = "quota";
          } else {
            result.failed += 1;
            console.error(`[wallet] fallo aviso a tarjeta ${c.id}: ${err.message}`);
          }
        }
        recipients.push({
          card_id: c.id,
          member_name: c.loyalty_members?.name ?? null,
          member_phone: c.loyalty_members?.phone ?? null,
          channel: "wallet",
          status,
        });
      })
    );
  }
  return { result, recipients };
}

async function sendPushBroadcast(
  admin: SupabaseClient,
  subs: { endpoint: string; p256dh: string; auth: string; card_id: string | null; program_id: string | null }[],
  cards: CardRow[],
  title: string,
  body: string,
  origin: string
): Promise<{ result: PushResult; recipients: RecipientInsert[] }> {
  const result: PushResult = { sent: 0, total: subs.length, details: [] };
  const recipients: RecipientInsert[] = [];
  if (subs.length === 0) return { result, recipients };
  const memberByCard = new Map(cards.map((c) => [c.id, c.loyalty_members]));
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
  const gone: string[] = [];
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
      const member = s.card_id ? memberByCard.get(s.card_id) : null;
      let status: RecipientInsert["status"] = "failed";
      try {
        await sendPush(
          s,
          title,
          body,
          `${origin}/t/${await tokenOf(admin, s.card_id)}`,
          logoByProgram.get(s.program_id ?? "") ?? null,
          badgeByProgram.get(s.program_id ?? "") ?? `${origin}/badge.png`
        );
        result.sent += 1;
        status = "sent";
        result.details.push({ browser: domainOf(s.endpoint), ok: true });
      } catch (e: unknown) {
        // 410 Gone = suscripción vencida → limpiar. El resto se reporta
        // (ej. 401 = claves VAPID rotadas) y queda en los logs de Vercel.
        const code = (e as { statusCode?: number }).statusCode;
        const msg = e instanceof Error ? e.message : "Error de envío.";
        console.error(`[push] fallo envío a ${domainOf(s.endpoint)}: status=${code} ${msg}`);
        if (code === 410) gone.push(s.endpoint);
        result.details.push({ browser: domainOf(s.endpoint), ok: false, error: `push service ${code ?? "?"}: ${msg.slice(0, 120)}` });
      }
      recipients.push({
        card_id: s.card_id,
        member_name: member?.name ?? null,
        member_phone: member?.phone ?? null,
        channel: "push",
        status,
      });
    })
  );
  if (gone.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", gone);
  }
  return { result, recipients };
}

async function tokenOf(admin: SupabaseClient, cardId: string | null) {
  if (!cardId) return "";
  const { data } = await admin.from("loyalty_cards").select("token").eq("id", cardId).single();
  return data?.token ?? "";
}
