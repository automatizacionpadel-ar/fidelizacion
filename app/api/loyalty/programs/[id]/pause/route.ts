import { NextResponse } from "next/server";
import { getMyBusiness, suspendedResponse } from "@/lib/loyalty/business";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const suspended = suspendedResponse(business);
  if (suspended) return suspended;

  const { data: program, error } = await supabase
    .from("loyalty_programs")
    .select("id,status")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!program) return NextResponse.json({ error: "Tarjeta no encontrada." }, { status: 404 });
  if (program.status !== "active") {
    return NextResponse.json({ error: "La tarjeta no está activa." }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("loyalty_programs")
    .update({ status: "paused" })
    .eq("id", id)
    .eq("business_id", business.id)
    .select("id,status")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ program: updated });
}
