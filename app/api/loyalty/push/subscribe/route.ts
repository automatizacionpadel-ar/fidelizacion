import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscribeSchema } from "@/lib/push/schemas";

// Pública: el cliente se suscribe desde su tarjeta web.
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Suscripción inválida." }, { status: 400 });
  const { card_token, endpoint, p256dh, auth } = parsed.data;

  const admin = createAdminClient();
  const { data: card } = await admin
    .from("loyalty_cards")
    .select("id,business_id,program_id,member_id")
    .eq("token", card_token)
    .maybeSingle();
  if (!card) return NextResponse.json({ error: "Tarjeta no válida." }, { status: 404 });

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      business_id: card.business_id,
      program_id: card.program_id,
      card_id: card.id,
      member_id: card.member_id,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: "No pudimos activar los avisos." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
