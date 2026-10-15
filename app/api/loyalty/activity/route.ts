import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";

const WINDOW_DAYS = 60;
const MAX_POINTS = 5000;

export async function GET() {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("created_at")
    .eq("business_id", business.id)
    .in("type", ["earn", "redeem"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_POINTS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    points: (data ?? []).map((t) => t.created_at),
    window_days: WINDOW_DAYS,
    sampled: (data ?? []).length >= MAX_POINTS,
  });
}
