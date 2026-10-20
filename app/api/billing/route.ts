import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { PLAN_IDS, currentPeriod, normalizePlan, planPrice, type PlanId } from "@/lib/billing";
import { normalizeBankSettings } from "@/lib/bank-settings";

function missingTable(error: { message?: string } | null): boolean {
  const m = error?.message ?? "";
  return m.includes("service_payments") || m.includes("schema cache");
}

export async function GET() {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  // Asegurar registro pendiente del mes en curso (con el precio del plan actual).
  const period = currentPeriod();
  const plan = normalizePlan((business as { plan?: string }).plan);
  const fee = planPrice(plan);
  const { data: existing, error: existingError } = await supabase
    .from("service_payments")
    .select("id")
    .eq("business_id", business.id)
    .eq("period", period)
    .maybeSingle();
  if (existingError && missingTable(existingError)) {
    return NextResponse.json(
      { error: "Falta crear la tabla de pagos. Corré supabase/migrations/006_service_payments.sql en Supabase." },
      { status: 400 }
    );
  }
  if (!existing) {
    await supabase
      .from("service_payments")
      .insert({ business_id: business.id, period, amount: fee });
  }

  const [{ data: pending }, { data: history }, { data: bank }] = await Promise.all([
    supabase
      .from("service_payments")
      .select("*")
      .eq("business_id", business.id)
      .in("status", ["pending", "pending_review"])
      .order("period", { ascending: true }),
    supabase
      .from("service_payments")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(24),
    supabase.from("bank_transfer_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return NextResponse.json({
    pending: pending ?? [],
    history: history ?? [],
    plan,
    monthly_fee: fee,
    business: { name: business.name, slug: business.slug },
    bank: normalizeBankSettings(bank),
  });
}

export async function PUT(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const json = await req.json().catch(() => null);
  const plan = String(json?.plan ?? "") as PlanId;
  if (!PLAN_IDS.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }

  const { count: inReview } = await supabase
    .from("service_payments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "pending_review");
  if ((inReview ?? 0) > 0) {
    return NextResponse.json(
      { error: "Tenés un comprobante en revisión. Esperá la confirmación para cambiar de plan." },
      { status: 409 }
    );
  }

  const { error: planError } = await supabase
    .from("businesses")
    .update({ plan })
    .eq("id", business.id);
  if (planError) {
    const m = planError.message ?? "";
    if (m.includes("plan") || m.includes("schema cache")) {
      return NextResponse.json(
        { error: "Falta la migración 007_business_plan.sql en Supabase." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: planError.message }, { status: 400 });
  }

  // El mes en curso aún pendiente pasa al precio del nuevo plan.
  await supabase
    .from("service_payments")
    .update({ amount: planPrice(plan) })
    .eq("business_id", business.id)
    .eq("period", currentPeriod())
    .eq("status", "pending");

  return NextResponse.json({ plan, monthly_fee: planPrice(plan) });
}
