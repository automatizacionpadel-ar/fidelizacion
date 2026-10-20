import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { getAdminKpis, mrrFromPlans, commissionFromPlans, collectionRate } from "@/lib/admin/kpis";
import { currentPeriod, formatMoney, periodLabel } from "@/lib/billing";
import { KpiCard } from "@/components/admin/KpiCard";
import { ActivityBars } from "@/components/admin/ActivityBars";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function validPeriod(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return currentPeriod();
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = validPeriod(periodParam);
  const { supabase } = await requireSuperAdmin();
  const kpis = await getAdminKpis(supabase, period);

  if (!kpis) {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Dashboard</h1>
        <Card style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Faltan aplicar las migraciones</h2>
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 8 }}>
            Corré las migraciones <code>013</code> a <code>019</code> en Supabase y recargá esta página.
          </p>
        </Card>
      </div>
    );
  }

  const mrr = mrrFromPlans(kpis.active_by_plan);
  const rate = collectionRate(kpis.paid_current, kpis.pending_current);
  const totalPlanClients = Object.values(kpis.clients_by_plan ?? {}).reduce(
    (a, n) => a + Number(n),
    0
  );

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Dashboard de plataforma</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>
            Resumen de clientes, aliados, uso y cobranza.
          </p>
        </div>
        <form className="flex items-end gap-2">
          <div>
            <label htmlFor="period" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>
              Período de cobranza
            </label>
            <input
              id="period"
              name="period"
              type="month"
              defaultValue={period}
              style={{ background: "#2A2A29", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 10px", fontSize: 14 }}
            />
          </div>
          <Button type="submit" variant="secondary">Ver</Button>
        </form>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4" style={{ marginTop: 20 }}>
        <KpiCard label="Clientes totales" value={kpis.clients_total} hint={`${kpis.clients_new_30d} nuevos en 30 días`} />
        <KpiCard label="Clientes activos" value={kpis.clients_active} hint={`${kpis.clients_suspended} suspendidos`} />
        <KpiCard label="Aliados activos" value={kpis.allies_active} hint={`${kpis.allies_total} en total`} />
        <KpiCard label="MRR estimado" value={formatMoney(mrr)} hint={`${totalPlanClients} clientes con plan`} accent="#F0F0EE" />
        <KpiCard label={`Cobrado ${periodLabel(period)}`} value={formatMoney(Number(kpis.paid_current))} hint={`${rate}% de cobro`} />
        <KpiCard label="Pendiente del mes" value={formatMoney(Number(kpis.pending_current))} hint="Incluye meses sin registrar" accent={Number(kpis.pending_current) > 0 ? "#f87171" : "#7AB619"} />
        <KpiCard label="Miembros" value={kpis.members_total} hint={`${kpis.new_members_30d} nuevos en 30 días`} />
        <KpiCard label="Tarjetas activas (30d)" value={kpis.active_cards_30d} hint={`${kpis.cards_total} emitidas`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" style={{ marginTop: 16 }}>
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>Actividad de los últimos 30 días</h2>
              <p style={{ fontSize: 12, color: "#9A9A96" }}>Sellados, canjes y ajustes por día.</p>
            </div>
            <p style={{ fontSize: 13, color: "#F0F0EE" }}>
              {kpis.transactions_30d} movimientos
            </p>
          </div>
          <div style={{ marginTop: 14 }}>
            <ActivityBars points={kpis.activity_30d ?? []} />
          </div>
          <div className="flex gap-4 flex-wrap" style={{ marginTop: 10, fontSize: 12, color: "#9A9A96" }}>
            <span>Sumas: <strong style={{ color: "#F0F0EE" }}>{kpis.earn_30d}</strong></span>
            <span>Canjes: <strong style={{ color: "#F0F0EE" }}>{kpis.redeem_30d}</strong></span>
            <span>Ajustes: <strong style={{ color: "#F0F0EE" }}>{kpis.adjust_30d}</strong></span>
            <span>Programas activos: <strong style={{ color: "#F0F0EE" }}>{kpis.programs_active}</strong></span>
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Accesos rápidos</h2>
          <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
            <Link href="/admin/clientes/nuevo"><Button style={{ width: "100%" }}>Nuevo cliente</Button></Link>
            <Link href="/admin/aliados/nuevo"><Button variant="secondary" style={{ width: "100%" }}>Nuevo aliado</Button></Link>
            <Link href="/admin/clientes?status=suspended"><Button variant="secondary" style={{ width: "100%" }}>Ver suspendidos</Button></Link>
          </div>
          <div style={{ borderTop: "1px solid #3D3D3B", marginTop: 16, paddingTop: 12 }}>
            <p style={{ fontSize: 12, color: "#9A9A96" }}>
              Clientes sin aliado: <strong style={{ color: "#F0F0EE" }}>{kpis.clients_without_ally}</strong>
            </p>
            <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4 }}>
              Actualizado: {new Date(kpis.generated_at).toLocaleString("es-AR")}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2" style={{ marginTop: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Top clientes (30 días)</h2>
          <Table
            head={["Negocio", "Movimientos", "Tarjetas"]}
            rows={(kpis.top_clients ?? []).map((c) => [
              <Link key={c.id} href={`/admin/clientes/${c.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>{c.name}</Link>,
              c.transactions,
              c.cards ?? "—",
            ])}
          />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Top aliados</h2>
          <Table
            head={["Aliado", "Activos", "Comisión est."]}
            rows={(kpis.top_allies ?? []).map((a) => [
              <Link key={a.id} href={`/admin/aliados/${a.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>{a.name}</Link>,
              a.active_clients,
              formatMoney(commissionFromPlans(a.active_by_plan, a.commission_rate)),
            ])}
          />
        </div>
      </div>
    </div>
  );
}
