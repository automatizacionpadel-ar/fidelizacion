import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { normalizePhoneAR } from "@/lib/auth/helpers";

export async function GET(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const phoneRaw = url.searchParams.get("phone");

  if (token) {
    const { data } = await supabase
      .from("loyalty_cards")
      .select("id,balance,rewards_available,program_id,loyalty_programs!inner(card_title,card_type,goal,status,earn_unit),loyalty_members!inner(name,phone)")
      .eq("token", token)
      .eq("business_id", business.id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "No encontramos esa tarjeta." }, { status: 404 });
    return NextResponse.json({ card: data });
  }

  if (phoneRaw) {
    const phone = normalizePhoneAR(phoneRaw);
    const { data } = await supabase
      .from("loyalty_cards")
      .select("id,balance,rewards_available,program_id,loyalty_programs!inner(card_title,card_type,goal,status,earn_unit),loyalty_members!inner(name,phone)")
      .eq("business_id", business.id)
      .eq("loyalty_members.phone", phone);
    return NextResponse.json({ cards: data ?? [] });
  }

  return NextResponse.json({ error: "Pasá token o phone." }, { status: 400 });
}
