import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/loyalty/ProgramForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PLANS, cardLimits, normalizePlan } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function NuevoProgramaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id,name,plan").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");

  const plan = normalizePlan((business as { plan?: string }).plan);
  const limits = cardLimits(plan);
  const { count: totalCards } = await supabase
    .from("loyalty_programs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  if ((totalCards ?? 0) >= limits.total) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Crear tarjeta</h1>
        <Card style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Límite del plan alcanzado</h2>
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 8 }}>
            El plan {PLANS[plan].label} permite hasta {limits.total} tarjetas diferentes.
            Ya tenés {totalCards}. Eliminá una tarjeta para crear otra.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/panel/tarjetas">
              <Button variant="secondary">Volver a Tarjetas</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { data: branches } = await supabase.from("branches").select("id,name").eq("business_id", business.id).order("created_at");

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Crear tarjeta</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 20 }}>Completá los pasos y publicá cuando esté lista.</p>
      <ProgramForm businessName={business.name} branches={branches ?? []} />
    </div>
  );
}
