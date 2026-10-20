import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { getAdminAllyDetail } from "@/lib/admin/allies";
import { formatMoney } from "@/lib/billing";
import { Table } from "@/components/ui/Table";
import { KpiCard } from "@/components/admin/KpiCard";
import { PlanBadge, StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminAllyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSuperAdmin();
  const ally = await getAdminAllyDetail(id);
  if (!ally) notFound();

  return (
    <div>
      <Link href="/admin/aliados" style={{ color: "#9A9A96", fontSize: 13 }}>← Volver a aliados</Link>

      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{ally.name}</h1>
        <StatusBadge status={ally.status} />
        <span style={{ background: "#3D3D3B", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
          {Number(ally.commission_rate)}% comisión
        </span>
      </div>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>{ally.email}</p>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4" style={{ marginTop: 16 }}>
        <KpiCard label="Clientes asignados" value={ally.clients_count} />
        <KpiCard label="Clientes activos" value={ally.active_clients} />
        <KpiCard label="Comisión estimada" value={formatMoney(ally.estimated_commission)} accent="#F0F0EE" />
        <KpiCard label="Estado" value={ally.status === "active" ? "Activo" : "Suspendido"} accent={ally.status === "active" ? "#7AB619" : "#f87171"} />
      </div>

      <div style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          Clientes asignados
        </h2>
        <Table
          head={["Negocio", "Plan", "Estado", "Alta", ""]}
          rows={ally.clients.map((c) => [
            <div key="n">
              <Link href={`/admin/clientes/${c.id}`} style={{ color: "#F0F0EE", fontWeight: 700 }}>{c.name}</Link>
              <p style={{ color: "#9A9A96", fontSize: 12 }}>/{c.slug}</p>
            </div>,
            <PlanBadge key="p" plan={c.plan} />,
            <StatusBadge key="s" status={c.status} />,
            new Date(c.created_at).toLocaleDateString("es-AR"),
            <Link key="v" href={`/admin/clientes/${c.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>Ver</Link>,
          ])}
        />
        {ally.clients_count > ally.clients.length ? (
          <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 8 }}>
            Mostrando {ally.clients.length} de {ally.clients_count}. Usá el filtro de clientes para ver el resto.
          </p>
        ) : null}
      </div>
    </div>
  );
}
