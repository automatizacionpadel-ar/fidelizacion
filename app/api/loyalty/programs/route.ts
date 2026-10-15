import { NextResponse } from "next/server";
import { getMyBusiness, enrollUrl } from "@/lib/loyalty/business";
import { programSchema } from "@/lib/loyalty/schemas";
import { slugify } from "@/lib/auth/helpers";

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = programSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos.", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  let slug = d.slug ?? slugify(`${business.slug}-${d.card_title}`);
  const { data: existing } = await supabase.from("loyalty_programs").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("loyalty_programs")
    .insert({ ...d, slug, business_id: business.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ program: data, enroll_url: enrollUrl(slug, new URL(req.url).origin) }, { status: 201 });
}
