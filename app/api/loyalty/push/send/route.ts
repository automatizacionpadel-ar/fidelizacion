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
  // Icono del programa (logo subido por el negocio) para que el aviso
  // muestre la marca en vez del logo del navegador.
  const programIds = [...new Set(subs.map((s) => s.program_id).filter(Boolean))];
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id,logo_url")
    .in("id", programIds.length > 0 ? programIds : ["00000000-0000-0000-0000-000000000000"]);
  const logoByProgram = new Map((programs ?? []).map((p) => [p.id, p.logo_url as string | null]));
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPush(
          s,
          title,
          body,
          `${origin}/t/${await tokenOf(s.card_id)}`,
          logoByProgram.get(s.program_id) ?? null,
          `${origin}/badge.png`
        );
        sent += 1;
      } catch (e: unknown) {
        // 410 Gone = suscripción vencida → limpiar
        if (e instanceof Error && (e as { statusCode?: number }).statusCode === 410) gone.push(s.endpoint);
      }
    })
  );
  if (gone.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", gone);
  }
  return NextResponse.json({ ok: true, sent, total: subs.length });
}

async function tokenOf(cardId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("loyalty_cards").select("token").eq("id", cardId).single();
  return data?.token ?? "";
}
