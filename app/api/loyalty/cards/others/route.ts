import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Otras tarjetas activas del negocio que el dueño de este token todavía no tiene.
// El token identifica al miembro: sin datos personales en la respuesta.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 10) return NextResponse.json({ cards: [] });

  const admin = createAdminClient();
  const { data: ref } = await admin
    .from("loyalty_cards")
    .select("member_id,business_id")
    .eq("token", token)
    .maybeSingle();
  if (!ref) return NextResponse.json({ cards: [] });

  const { data: business } = await admin
    .from("businesses")
    .select("status")
    .eq("id", ref.business_id)
    .maybeSingle();
  if (business?.status === "suspended") return NextResponse.json({ cards: [] });

  const [{ data: programs }, { data: mine }] = await Promise.all([
    admin
      .from("loyalty_programs")
      .select("id,slug,card_title")
      .eq("business_id", ref.business_id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    admin
      .from("loyalty_cards")
      .select("program_id")
      .eq("member_id", ref.member_id),
  ]);

  const held = new Set((mine ?? []).map((c) => c.program_id));
  return NextResponse.json({
    cards: (programs ?? []).filter((p) => !held.has(p.id)),
  });
}
