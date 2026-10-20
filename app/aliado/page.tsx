import Link from "next/link";
import QRCode from "qrcode";
import { requireAlly } from "@/lib/auth/roles";
import { slugify } from "@/lib/auth/helpers";
import { getAllyKpis, mrrFromPlans, commissionFromPlans } from "@/lib/admin/kpis";
import { currentPeriod, formatMoney, periodLabel } from "@/lib/billing";
import { KpiCard } from "@/components/admin/KpiCard";
import { ActivityBars } from "@/components/admin/ActivityBars";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { StatusBadge, PlanBadge } from "@/components/admin/StatusBadge";
import { AllyQrMenu } from "@/components/ally/AllyQrMenu";
import { requestBaseUrl } from "@/lib/loyalty/business";

export const dynamic = "force-dynamic";

function validPeriod(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return currentPeriod();
}

export default async function AllyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = validPeriod(periodParam);
  const { supabase, ally } = await requireAlly();
  const kpis = await getAllyKpis(supabase, ally.id, period);

  if (!kpis) {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mi cartera</h1>
        <Card style={{ marginTop: 16 }}>
          <p style={{ fontSize: 14, color: "#9A9A96" }}>
            No se pudieron cargar las métricas. Verificá que las migraciones 013–019 estén aplicadas.
          </p>
        </Card>
      </div>
    );
  }

  const mrr = mrrFromPlans(kpis.active_by_plan);
  const commission = commissionFromPlans(kpis.active_by_plan, Number(ally.commission_rate));
  const referralUrl = new URL("/registro", await requestBaseUrl());
  referralUrl.searchParams.set("aliado", ally.id);
  const qrDataUrl = await QRCode.toDataURL(referralUrl.toString(), {
    width: 1024,
    margin: 2,
    color: { dark: "#20201F", light: "#F0F0EE" },
  });

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Hola, {ally.name}</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>
            Resumen de tu cartera de clientes.
          </p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <form className="flex items-end gap-2">
            <div>
              <label htmlFor="period" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Período</label>
              <input id="period" name="period" type="month" defaultValue={period} style={{ background: "#2A2A29", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 10px", fontSize: 14 }} />
            </div>
            <Button type="submit" variant="secondary">Ver</Button>
          </form>
          <AllyQrMenu
            allyName={ally.name}
            url={referralUrl.toString()}
            qrDataUrl={qrDataUrl}
            downloadName={`qr-${slugify(ally.name)}.png`}
          />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4" style={{ marginTop: 20 }}>
        <KpiCard label="Clientes asignados" value={kpis.clients_total} />
        <KpiCard label="Activos" value={kpis.clients_active} hint={`${kpis.clients_suspended} suspendidos`} />
        <KpiCard label="MRR de la cartera" value={formatMoney(mrr)} accent="#F0F0EE" />
        <KpiCard label="Comisión estimada" value={formatMoney(commission)} hint={`${Number(ally.commission_rate)}% del MRR`} />
        <KpiCard label={`Cobrado ${periodLabel(period)}`} value={formatMoney(Number(kpis.paid_current))} />
        <KpiCard label="Pendiente del mes" value={formatMoney(Number(kpis.pending_current))} accent={Number(kpis.pending_current) > 0 ? "#f87171" : "#7AB619"} />
        <KpiCard label="Miembros" value={kpis.members_total} hint={`${kpis.new_members_30d} nuevos en 30 días`} />
        <KpiCard label="Tarjetas activas (30d)" value={kpis.active_cards_30d} hint={`${kpis.cards_total} emitidas`} />
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Actividad de la cartera</h2>
            <p style={{ fontSize: 12, color: "#9A9A96" }}>Últimos 30 días.</p>
          </div>
          <p style={{ fontSize: 13 }}>{kpis.transactions_30d} movimientos</p>
        </div>
        <div style={{ marginTop: 14 }}>
          <ActivityBars points={kpis.activity_30d ?? []} />
        </div>
        <div className="flex gap-4" style={{ marginTop: 10, fontSize: 12, color: "#9A9A96" }}>
          <span>Sumas: <strong style={{ color: "#F0F0EE" }}>{kpis.earn_30d}</strong></span>
          <span>Canjes: <strong style={{ color: "#F0F0EE" }}>{kpis.redeem_30d}</strong></span>
        </div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Top clientes (30 días)</h2>
          <Link href="/aliado/clientes" style={{ fontSize: 13, color: "#7AB619", fontWeight: 700 }}>Ver todos</Link>
        </div>
        <div style={{ marginTop: 8 }}>
          <Table
            head={["Negocio", "Plan", "Estado", "Movimientos"]}
            rows={(kpis.top_clients ?? []).map((c) => [
              <Link key="n" href={`/aliado/clientes/${c.id}`} style={{ color: "#F0F0EE", fontWeight: 700 }}>{c.name}</Link>,
              <PlanBadge key="p" plan={c.plan ?? "base"} />,
              <StatusBadge key="s" status={c.status ?? "active"} />,
              c.transactions,
            ])}
          />
        </div>
      </div>
    </div>
  );
}
