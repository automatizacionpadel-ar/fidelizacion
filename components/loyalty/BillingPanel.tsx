"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { PaymentReceiptForm } from "@/components/loyalty/PaymentReceiptForm";
import {
  PLANS,
  PLAN_IDS,
  formatMoney,
  periodLabel,
  type PlanId,
} from "@/lib/billing";
import { bankDetailRows, hasBankSettings, type BankSettings } from "@/lib/bank-settings";

type Payment = {
  id: string;
  period: string;
  amount: number;
  status: "pending" | "pending_review" | "paid";
  method: string | null;
  note: string;
  receipt_name: string;
  submitted_at: string | null;
  paid_at: string | null;
};

type BillingData = {
  pending: Payment[];
  history: Payment[];
  plan: PlanId;
  monthly_fee: number;
  business: { name: string; slug: string };
  bank: BankSettings;
};

function methodLabel(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export function BillingPanel() {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);

  const load = useCallback(() => {
    fetch("/api/billing")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "No se pudo cargar.");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Card style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>Pagos</h2>
        <p style={{ fontSize: 14, color: "#f87171", marginTop: 8 }}>{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card style={{ marginTop: 24 }}>
        <p style={{ fontSize: 14, color: "#9A9A96" }}>Cargando pagos…</p>
      </Card>
    );
  }

  const totalPending = data.pending.reduce((a, p) => a + Number(p.amount), 0);
  const hasReview = data.pending.some((p) => p.status === "pending_review");

  async function changePlan(plan: PlanId) {
    if (plan === data?.plan || changingPlan) return;
    setChangingPlan(true);
    setFormError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cambiar el plan.");
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo cambiar el plan.");
    } finally {
      setChangingPlan(false);
    }
  }

  return (
    <div>
      <Card style={{ marginTop: 24 }}>
        <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>TU PLAN</p>
        <div className="grid gap-3 md:grid-cols-2" style={{ marginTop: 12 }}>
          {PLAN_IDS.map((id) => {
            const isCurrent = data.plan === id;
            return (
              <div
                key={id}
                style={{
                  border: isCurrent ? "2px solid #7AB619" : "1px solid #3D3D3B",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div className="flex items-center justify-between">
                  <strong style={{ fontSize: 16 }}>{PLANS[id].label}</strong>
                  {isCurrent && (
                    <span style={{ background: "#7AB619", color: "#20201F", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "2px 10px" }}>
                      Actual
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{formatMoney(PLANS[id].price)}<span style={{ fontSize: 13, fontWeight: 400, color: "#9A9A96" }}>/mes</span></p>
                {!isCurrent && (
                  <div style={{ marginTop: 10 }}>
                    <Button variant="secondary" disabled={changingPlan || hasReview} onClick={() => changePlan(id)}>
                      {changingPlan ? "Cambiando…" : `Cambiar a ${PLANS[id].label}`}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {hasReview ? (
          <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 8 }}>
            Podés cambiar de plan cuando se confirme el comprobante en revisión.
          </p>
        ) : null}
        {formError ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{formError}</p> : null}
      </Card>

      {data.pending.length > 0 ? (
        hasBankSettings(data.bank) ? (
          <Card style={{ marginTop: 16, borderColor: "#7AB619" }}>
            <p style={{ fontSize: 12, color: "#7AB619", fontWeight: 800 }}>DATOS PARA TRANSFERIR</p>
            <dl className="grid gap-x-4 gap-y-2 md:grid-cols-2" style={{ marginTop: 12, fontSize: 14 }}>
              {bankDetailRows(data.bank).map(([label, value]) => (
                <div key={label}>
                  <dt style={{ color: "#9A9A96", fontSize: 12 }}>{label}</dt>
                  <dd style={{ fontWeight: 700, wordBreak: "break-all" }}>{value}</dd>
                </div>
              ))}
            </dl>
            {data.bank.notes ? (
              <p style={{ color: "#F0F0EE", fontSize: 13, marginTop: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {data.bank.notes}
              </p>
            ) : null}
            <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
              Transferí el monto exacto de cada período y subí el comprobante.
              Usá como referencia el nombre del negocio y el período del pago.
            </p>
          </Card>
        ) : (
          <Card style={{ marginTop: 16, borderColor: "#f59e0b" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>DATOS DE TRANSFERENCIA PENDIENTES</p>
            <p style={{ fontSize: 14, marginTop: 4, color: "#9A9A96" }}>
              El administrador todavía no configuró los datos bancarios. Contactalo para recibir la información.
            </p>
          </Card>
        )
      ) : null}

      <Card style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>MONTO PENDIENTE</p>
        <p style={{ fontSize: 36, fontWeight: 800, color: totalPending > 0 ? "#f87171" : "#7AB619", marginTop: 4 }}>
          {formatMoney(totalPending)}
        </p>
        {data.pending.length === 0 ? (
          <p style={{ fontSize: 14, color: "#7AB619", marginTop: 8 }}>✓ Estás al día, no debés ningún mes.</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
            {data.pending.map((p) => {
              const inReview = p.status === "pending_review";
              return (
                <div
                  key={p.id}
                  style={{ border: "1px solid #3D3D3B", borderRadius: 10, padding: 12 }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <strong style={{ fontSize: 15 }}>{periodLabel(p.period)}</strong>
                      <p style={{ fontSize: 14, color: "#9A9A96" }}>{formatMoney(Number(p.amount))}</p>
                    </div>
                    {inReview ? (
                      <span style={{ background: "#3D3D3B", color: "#F0F0EE", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "4px 10px" }}>
                        COMPROBANTE EN REVISIÓN
                      </span>
                    ) : null}
                  </div>

                  <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>
                    Referencia: {data.business.slug}-{p.period}
                  </p>

                  {inReview ? (
                    <div style={{ marginTop: 8, color: "#9A9A96", fontSize: 13, lineHeight: 1.5 }}>
                      <p>
                        Recibimos {p.receipt_name || "tu comprobante"}
                        {p.submitted_at ? ` el ${formatDate(p.submitted_at)}` : ""}.
                      </p>
                      <p>Un administrador lo va a revisar y activará la cuenta al confirmarlo.</p>
                      {p.note ? <p style={{ marginTop: 4 }}>Nota: {p.note}</p> : null}
                    </div>
                  ) : (
                    <PaymentReceiptForm
                      paymentId={p.id}
                      reference={`${data.business.slug}-${p.period}`}
                      onUploaded={load}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 24 }}>Pagos realizados</h2>
      <div style={{ marginTop: 12 }}>
        <Table
          head={["Período", "Monto", "Método", "Fecha de pago", "Nota"]}
          rows={data.history.map((p) => [
            periodLabel(p.period),
            formatMoney(Number(p.amount)),
            methodLabel(p.method),
            formatDate(p.paid_at),
            p.note || "—",
          ])}
        />
      </div>
    </div>
  );
}
