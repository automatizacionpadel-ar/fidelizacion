import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { getAdminClientDetail } from "@/lib/admin/clients";
import { getAlliesOptions } from "@/lib/admin/allies";
import { formatMoney, planPrice } from "@/lib/billing";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/admin/KpiCard";
import { PlanBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { ClientEditForm } from "@/components/admin/ClientEditForm";
import { ClientActions } from "@/components/admin/ClientActions";
import { AdminPaymentsPanel } from "@/components/admin/AdminPaymentsPanel";

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSuperAdmin();
  const [client, allies] = await Promise.all([getAdminClientDetail(id), getAlliesOptions()]);
  if (!client) notFound();

  return (
    <div>
      <Link href="/admin/clientes" style={{ color: "#9A9A96", fontSize: 13 }}>← Volver a clientes</Link>

      <div className="flex items-start justify-between flex-wrap gap-3" style={{ marginTop: 8 }}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{client.name}</h1>
            <StatusBadge status={client.status} />
            <PlanBadge plan={client.plan} />
          </div>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>/{client.slug}</p>
        </div>
      </div>

      {client.status === "suspended" ? (
        <Card style={{ marginTop: 16, borderColor: "#f87171" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171" }}>CLIENTE SUSPENDIDO</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            {client.suspended_reason || "Sin motivo registrado."}
          </p>
          {client.suspended_at ? (
            <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4 }}>
              Desde {new Date(client.suspended_at).toLocaleString("es-AR")}
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4" style={{ marginTop: 16 }}>
        <KpiCard label="Miembros" value={client.members} />
        <KpiCard label="Tarjetas" value={client.cards} />
        <KpiCard label="Activas (30d)" value={client.active_cards_30d} />
        <KpiCard label="Movimientos" value={client.transactions} accent="#F0F0EE" />
      </div>

      <Card style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>Pagos</h2>
        <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4, marginBottom: 12 }}>
          Al confirmar un pago, el negocio se activa automáticamente.
        </p>
        <AdminPaymentsPanel payments={client.payments} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]" style={{ marginTop: 16 }}>
        <div>
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Datos generales</h2>
            <dl style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8 }}>
              <dt style={{ color: "#9A9A96", fontSize: 12 }}>Dueño</dt>
              <dd>{client.owner_name ?? "—"}</dd>
              <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Email</dt>
              <dd>{client.owner_email ?? "—"}</dd>
              <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Teléfono</dt>
              <dd>{client.owner_phone ?? "—"}</dd>
              <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Aliado</dt>
              <dd>{client.ally_name ?? "Sin aliado"}</dd>
              <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Alta</dt>
              <dd>{new Date(client.created_at).toLocaleString("es-AR")}</dd>
              <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Plan</dt>
              <dd>{client.plan === "pro" ? "Pro" : "Básico"} · {formatMoney(planPrice(client.plan))}/mes</dd>
            </dl>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Acciones</h2>
            <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4, marginBottom: 12 }}>
              El borrado es definitivo y queda registrado en auditoría.
            </p>
            <ClientActions client={{ id: client.id, name: client.name, slug: client.slug, status: client.status }} />
          </Card>
        </div>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Editar cliente</h2>
          <p style={{ fontSize: 12, color: "#9A9A96", marginBottom: 14 }}>
            El email y la contraseña del dueño se gestionan por separado.
          </p>
          <ClientEditForm client={client} allies={allies} />
        </Card>
      </div>
    </div>
  );
}
