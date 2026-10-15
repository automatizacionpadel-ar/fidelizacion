"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { PAYMENT_METHODS, PLANS, PLAN_IDS, formatMoney, periodLabel, type PlanId } from "@/lib/billing";

type Payment = {
  id: string;
  period: string;
  amount: number;
  status: "pending" | "paid";
  method: string | null;
  note: string;
  paid_at: string | null;
};

type BillingData = {
  pending: Payment[];
  history: Payment[];
  plan: PlanId;
  monthly_fee: number;
};

function methodLabel(value: string | null): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value ?? "—";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export function BillingPanel() {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("transferencia");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
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

  async function registerPayment(id: string) {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, method, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo registrar.");
      setPayingId(null);
      setNote("");
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo registrar.");
    } finally {
      setSaving(false);
    }
  }

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
                    <Button variant="secondary" disabled={changingPlan} onClick={() => changePlan(id)}>
                      {changingPlan ? "Cambiando…" : `Cambiar a ${PLANS[id].label}`}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {formError && !payingId && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{formError}</p>}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>MONTO PENDIENTE</p>
        <p style={{ fontSize: 36, fontWeight: 800, color: totalPending > 0 ? "#f87171" : "#7AB619", marginTop: 4 }}>
          {formatMoney(totalPending)}
        </p>
        {data.pending.length === 0 ? (
          <p style={{ fontSize: 14, color: "#7AB619", marginTop: 8 }}>✓ Estás al día, no debés ningún mes.</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
            {data.pending.map((p) => (
              <div
                key={p.id}
                style={{ border: "1px solid #3D3D3B", borderRadius: 10, padding: 12 }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <strong style={{ fontSize: 15 }}>{periodLabel(p.period)}</strong>
                    <p style={{ fontSize: 14, color: "#9A9A96" }}>{formatMoney(Number(p.amount))}</p>
                  </div>
                  {payingId !== p.id && (
                    <Button variant="secondary" onClick={() => { setPayingId(p.id); setFormError(null); }}>
                      Registrar pago
                    </Button>
                  )}
                </div>
                {payingId === p.id && (
                  <div className="grid gap-3 md:grid-cols-[200px_1fr]" style={{ marginTop: 12 }}>
                    <div>
                      <Label>Método</Label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 15 }}
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Comprobante / nota (opcional)</Label>
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ej. Transferencia N° 12345"
                      />
                    </div>
                    <div className="flex gap-2 md:col-span-2">
                      <Button disabled={saving} onClick={() => registerPayment(p.id)}>
                        {saving ? "Guardando…" : "Confirmar pago"}
                      </Button>
                      <Button variant="secondary" onClick={() => setPayingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                    {formError && <p style={{ color: "#f87171", fontSize: 13, gridColumn: "1 / -1" }}>{formError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 24 }}>Pagos realizados</h2>
      <div style={{ marginTop: 12 }}>
        <Table
          head={["Período", "Monto", "Método", "Fecha de pago", "Comprobante"]}
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
