import { NextResponse } from "next/server";
import { getMyBusiness, enrollUrl, suspendedResponse } from "@/lib/loyalty/business";
import { programSchema } from "@/lib/loyalty/schemas";
import { slugify } from "@/lib/auth/helpers";
import { cardLimitMessage, cardLimits } from "@/lib/billing";

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
  const json = await req.json().catch(() => null);
  const parsed = programSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos.", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const limits = cardLimits(business.plan);
  const { count: existingCount } = await supabase
    .from("loyalty_programs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  if ((existingCount ?? 0) >= limits.total) {
    return NextResponse.json(
      { error: `${cardLimitMessage(business.plan, "total")} Eliminá una tarjeta para crear otra.`, limit: "total" },
      { status: 403 }
    );
  }
  let slug = d.slug ?? slugify(`${business.slug}-${d.card_title}`);
  const { data: existing } = await supabase.from("loyalty_programs").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("loyalty_programs")
    .insert({ ...d, status: "draft", slug, business_id: business.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ program: data, enroll_url: enrollUrl(slug, new URL(req.url).origin) }, { status: 201 });
}
