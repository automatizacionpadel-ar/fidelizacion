import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";

export async function GET() {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ count: cards }, { data: txMonth }, { data: recent }] = await Promise.all([
    supabase.from("loyalty_cards").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("loyalty_transactions").select("type,amount,created_at").eq("business_id", business.id).gte("created_at", monthAgo),
    supabase.from("loyalty_transactions").select("card_id,created_at").eq("business_id", business.id).gte("created_at", monthAgo),
  ]);

  const earned = (txMonth ?? []).filter((t) => t.type === "earn").reduce((a, t) => a + (t.amount ?? 0), 0);
  const redeemed = (txMonth ?? []).filter((t) => t.type === "redeem").length;
  const activeCards = new Set((recent ?? []).map((t) => t.card_id)).size;

  // Clientes sin volver hace 30+ días
  const { data: lastVisits } = await supabase
    .from("loyalty_cards")
    .select("id,last_earn_at")
    .eq("business_id", business.id)
    .not("last_earn_at", "is", null);
  const dormant = (lastVisits ?? []).filter((c) => c.last_earn_at && c.last_earn_at < monthAgo).length;

  return NextResponse.json({
    cards_issued: cards ?? 0,
    earned_month: earned,
    redeemed_month: redeemed,
    active_30d: activeCards,
    dormant_30d: dormant,
  });
}
