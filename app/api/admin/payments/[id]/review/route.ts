import { NextResponse } from "next/server";
import { getSuperAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentReviewSchema } from "@/lib/admin/schemas";
import { logAdminAction } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/http";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSuperAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const json = await req.json().catch(() => null);
  const parsed = paymentReviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from("service_payments")
    .select("id,business_id,period,amount,status,method,paid_at,reviewed_at,reviewed_by")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!payment) return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
  if (payment.status === "paid") {
    return NextResponse.json({ error: "Ese pago ya está confirmado." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error: paymentError } = await admin
    .from("service_payments")
    .update({
      status: "paid",
      method: payment.method || "transferencia",
      paid_at: now,
      reviewed_at: now,
      reviewed_by: session.user.id,
    })
    .eq("id", id);
  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 });

  const { error: businessError } = await admin
    .from("businesses")
    .update({
      status: "active",
      suspended_at: null,
      suspended_reason: "",
      suspended_by: null,
    })
    .eq("id", payment.business_id);
  if (businessError) {
    await admin
      .from("service_payments")
      .update({
        status: payment.status,
        paid_at: payment.paid_at,
        reviewed_at: payment.reviewed_at,
        reviewed_by: payment.reviewed_by,
      })
      .eq("id", id);
    return NextResponse.json(
      { error: `No se pudo activar el negocio y el pago no se confirmó: ${businessError.message}` },
      { status: 400 }
    );
  }

  await logAdminAction({
    actorUserId: session.user.id,
    action: "payment.mark_paid",
    entityType: "business",
    entityId: payment.business_id,
    metadata: {
      payment_id: payment.id,
      period: payment.period,
      amount: payment.amount,
      activated: true,
    },
  });

  return NextResponse.json({ ok: true });
}
