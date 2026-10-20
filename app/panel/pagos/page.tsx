import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingPanel } from "@/components/loyalty/BillingPanel";
import { PLANS, normalizePlan } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id,plan")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) redirect("/panel");

  const plan = normalizePlan((business as { plan?: string }).plan);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Pagos</h1>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#20201F",
            background: "#7AB619",
            border: "1px solid #7AB619",
            borderRadius: 999,
            padding: "5px 12px",
          }}
        >
          Plan {PLANS[plan].label}
        </span>
      </div>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>La mensualidad de tu servicio.</p>
      <BillingPanel />
    </div>
  );
}
