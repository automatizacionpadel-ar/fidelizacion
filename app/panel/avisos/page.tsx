import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PushSender } from "@/components/loyalty/PushSender";
import { Table } from "@/components/ui/Table";

export const dynamic = "force-dynamic";

function channelLabel(c: string) {
  return c === "wallet" ? "Google Wallet" : c === "push" ? "Navegador" : "Ambos";
}

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
  const { data: sends } = await supabase
    .from("notification_sends")
    .select("id,title,channel,created_at,wallet_sent,wallet_not_saved,wallet_quota,wallet_failed,push_sent,push_total,loyalty_programs(card_title)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Notificaciones</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 16 }}>
        Mandales un aviso al celu a tus clientes. Por Google Wallet llega aunque tengan el
        navegador cerrado.
      </p>
      <PushSender programs={programs ?? []} />

      <h2 style={{ fontWeight: 800, marginTop: 28, marginBottom: 12 }}>Historial de envíos</h2>
      <Table
        head={["Fecha", "Tarjeta", "Título", "Por dónde", "Entregados", ""]}
        rows={(sends ?? []).map((s) => {
          const p = s.loyalty_programs as unknown as { card_title: string } | null;
          const delivered = s.wallet_sent + s.push_sent;
          const attempted =
            s.wallet_sent + s.wallet_not_saved + s.wallet_quota + s.wallet_failed + s.push_total;
          return [
            new Date(s.created_at).toLocaleString("es-AR"),
            p?.card_title ?? "—",
            s.title,
            channelLabel(s.channel),
            `${delivered} de ${attempted}`,
            <Link key={s.id} href={`/panel/avisos/${s.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>
              Ver
            </Link>,
          ];
        })}
      />
    </div>
  );
}
