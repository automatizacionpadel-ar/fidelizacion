import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

export const dynamic = "force-dynamic";

function channelLabel(c: string) {
  return c === "wallet" ? "Google Wallet" : c === "push" ? "Navegador" : "Ambos";
}

function statusLabel(s: string) {
  return s === "sent"
    ? "✅ Entregado"
    : s === "not_saved"
      ? "⚠️ Sin tarjeta en Wallet"
      : s === "quota"
        ? "⏳ Límite diario"
        : "❌ Falló";
}

export default async function AvisoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");

  const { data: send } = await supabase
    .from("notification_sends")
    .select("*,loyalty_programs(card_title)")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!send) notFound();

  const { data: recipients } = await supabase
    .from("notification_recipients")
    .select("member_name,member_phone,channel,status,created_at")
    .eq("send_id", id)
    .order("channel", { ascending: true })
    .order("status", { ascending: true });

  const p = send.loyalty_programs as unknown as { card_title: string } | null;
  const delivered = send.wallet_sent + send.push_sent;

  return (
    <div>
      <Link href="/panel/avisos" style={{ color: "#9A9A96", fontSize: 14 }}>← Notificaciones</Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{send.title}</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 4 }}>
        {p?.card_title ?? "—"} · {channelLabel(send.channel)} · {new Date(send.created_at).toLocaleString("es-AR")}
      </p>

      <Card style={{ marginTop: 16 }}>
        <p><strong>{send.body}</strong></p>
        <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 10 }}>
          Entregados: <strong style={{ color: "#F0F0EE" }}>{delivered}</strong> · Google Wallet: {send.wallet_sent} entregados
          {send.wallet_not_saved > 0 ? `, ${send.wallet_not_saved} sin tarjeta en Wallet` : ""}
          {send.wallet_quota > 0 ? `, ${send.wallet_quota} en límite diario` : ""}
          {send.wallet_failed > 0 ? `, ${send.wallet_failed} con error` : ""}
          {send.push_total > 0 || send.channel !== "wallet" ? ` · Navegador: ${send.push_sent} de ${send.push_total}` : ""}
        </p>
      </Card>

      <h2 style={{ fontWeight: 800, marginTop: 20, marginBottom: 12 }}>Destinatarios</h2>
      <Table
        head={["Cliente", "Teléfono", "Por dónde", "Estado"]}
        rows={(recipients ?? []).map((r) => [
          r.member_name ?? "—",
          r.member_phone ?? "—",
          channelLabel(r.channel),
          statusLabel(r.status),
        ])}
      />
    </div>
  );
}
