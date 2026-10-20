import { NextResponse } from "next/server";
import { z } from "zod";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";

const branchSchema = z.object({
  name: z.string().min(2).max(80),
  address: z.string().max(200).default(""),
  phone: z.string().max(30).default(""),
});

export async function GET() {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data } = await supabase.from("branches").select("*").eq("business_id", business.id).order("created_at");
  return NextResponse.json({ branches: data ?? [] });
}

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;
  const json = await req.json().catch(() => null);
  const parsed = branchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { data, error } = await supabase
    .from("branches")
    .insert({ ...parsed.data, business_id: business.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branch: data }, { status: 201 });
}
