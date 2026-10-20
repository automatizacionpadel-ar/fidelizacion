import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAlly } from "@/lib/auth/roles";
import { getAdminClientDetail } from "@/lib/admin/clients";
import { formatMoney, planPrice } from "@/lib/billing";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/admin/KpiCard";
import { PlanBadge, StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AllyClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ally } = await requireAlly();
  const client = await getAdminClientDetail(id);
  if (!client || client.ally_id !== ally.id) notFound();

  return (
    <div>
      <Link href="/aliado/clientes" style={{ color: "#9A9A96", fontSize: 13 }}>← Volver a mis clientes</Link>

      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{client.name}</h1>
        <StatusBadge status={client.status} />
        <PlanBadge plan={client.plan} />
      </div>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>/{client.slug}</p>

      {client.status === "suspended" ? (
        <Card style={{ marginTop: 16, borderColor: "#f87171" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171" }}>CLIENTE SUSPENDIDO</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>{client.suspended_reason || "Sin motivo registrado."}</p>
        </Card>
      ) : null}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4" style={{ marginTop: 16 }}>
        <KpiCard label="Miembros" value={client.members} />
        <KpiCard label="Tarjetas" value={client.cards} />
        <KpiCard label="Activas (30d)" value={client.active_cards_30d} />
        <KpiCard label="Movimientos" value={client.transactions} accent="#F0F0EE" />
      </div>

      <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 16 }}>
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Resumen comercial</h2>
          <dl style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8 }}>
            <dt style={{ color: "#9A9A96", fontSize: 12 }}>Plan</dt>
            <dd>{client.plan === "pro" ? "Pro" : "Base"} · {formatMoney(planPrice(client.plan))}/mes</dd>
            <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Alta</dt>
            <dd>{new Date(client.created_at).toLocaleString("es-AR")}</dd>
            <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Estado</dt>
            <dd>{client.status === "active" ? "Activo" : "Suspendido"}</dd>
          </dl>
        </Card>
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Privacidad</h2>
          <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            Este portal muestra métricas agregadas del negocio. Los datos personales
            de los consumidores finales no están disponibles para aliados.
          </p>
        </Card>
      </div>
    </div>
  );
}
