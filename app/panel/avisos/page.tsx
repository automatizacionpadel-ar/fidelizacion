import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PushSender } from "@/components/loyalty/PushSender";

export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");
  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("id,card_title")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Notificaciones</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 16 }}>
        Mandales un aviso al celu a tus clientes suscriptos.
      </p>
      <PushSender programs={programs ?? []} />
    </div>
  );
}
