import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingPanel } from "@/components/loyalty/BillingPanel";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) redirect("/panel");

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Pagos</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>La mensualidad de tu servicio.</p>
      <BillingPanel />
    </div>
  );
}
