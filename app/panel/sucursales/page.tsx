import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BranchesManager } from "@/components/loyalty/BranchesManager";
import { planHasBranches } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id,plan").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");
  if (!planHasBranches(business.plan)) redirect("/panel");

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Sucursales</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 20 }}>
        Cada sucursal opera individual: sus tarjetas y promos no valen en las demás.
      </p>
      <BranchesManager />
    </div>
  );
}
