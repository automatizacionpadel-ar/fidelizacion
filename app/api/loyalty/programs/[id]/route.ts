import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { programSchema } from "@/lib/loyalty/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = programSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { data, error } = await supabase
    .from("loyalty_programs")
    .update({ ...parsed.data })
    .eq("id", id)
    .eq("business_id", business.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ program: data });
}
