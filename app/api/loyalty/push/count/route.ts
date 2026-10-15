import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";

export async function GET(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const programId = new URL(req.url).searchParams.get("program_id");
  if (!programId) return NextResponse.json({ error: "Falta program_id." }, { status: 400 });
  const { supabase } = await getMyBusiness();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("program_id", programId);
  return NextResponse.json({ count: count ?? 0 });
}
