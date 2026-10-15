import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { adjustSchema } from "@/lib/loyalty/schemas";
import { notifyN8n } from "@/lib/loyalty/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = adjustSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });

  const { data: card } = await supabase
    .from("loyalty_cards")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();
  if (!card) return NextResponse.json({ error: "Tarjeta no encontrada." }, { status: 404 });

  const newBalance = Math.max(0, card.balance + parsed.data.amount);
  const { error } = await supabase.from("loyalty_cards").update({ balance: newBalance, pending_sync: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from("loyalty_transactions").insert({
    business_id: business.id, program_id: card.program_id, card_id: id,
    type: "adjust", amount: parsed.data.amount, created_by: user.id, source: "manual", note: parsed.data.note,
  });
  notifyN8n("adjust", { business_id: business.id, card_id: id, amount: parsed.data.amount });
  return NextResponse.json({ ok: true, balance: newBalance });
}
