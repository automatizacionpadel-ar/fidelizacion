"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { PaymentReceiptForm } from "@/components/loyalty/PaymentReceiptForm";
import { formatMoney, periodLabel, periodMonthLabel } from "@/lib/billing";
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

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 24 }}>
        <Card style={{ height: "100%" }}>
          <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>MONTO PENDIENTE</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: totalPending > 0 ? "#f87171" : "#7AB619", marginTop: 4 }}>
            {formatMoney(totalPending)}
          </p>

          {data.pending.length === 0 ? (
            <p style={{ fontSize: 14, color: "#7AB619", marginTop: 8 }}>✓ Estás al día, no debés ningún mes.</p>
          ) : (
            <div className="flex flex-col">
              {data.pending.map((p) => {
                const inReview = p.status === "pending_review";
                return (
                  <div key={p.id} style={{ marginTop: 16, borderTop: "1px solid #3D3D3B", paddingTop: 14 }}>
                    <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>PERÍODO FACTURADO</p>
                    <p style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{periodMonthLabel(p.period)}</p>

                    {inReview ? (
                      <div style={{ marginTop: 12, color: "#9A9A96", fontSize: 13, lineHeight: 1.5 }}>
                        <span style={{ background: "#3D3D3B", color: "#F0F0EE", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "4px 10px", display: "inline-block", marginBottom: 8 }}>
                          COMPROBANTE EN REVISIÓN
                        </span>
                        <p>
                          Recibimos {p.receipt_name || "tu comprobante"}
                          {p.submitted_at ? ` el ${formatDate(p.submitted_at)}` : ""}.
                        </p>
                        <p>Un administrador lo va a revisar y activará la cuenta al confirmarlo.</p>
                        {p.note ? <p style={{ marginTop: 4 }}>Nota: {p.note}</p> : null}
                      </div>
                    ) : (
                      <PaymentReceiptForm paymentId={p.id} onUploaded={load} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card style={{ height: "100%" }}>
          <p style={{ fontSize: 14, color: "#7AB619", fontWeight: 800 }}>DATOS PARA TRANSFERIR</p>
          {hasBankSettings(data.bank) ? (
            <>
              <dl className="grid gap-y-2" style={{ marginTop: 12, fontSize: 16 }}>
                {bankDetailRows(data.bank).map(([label, value]) => (
                  <div key={label}>
                    <dt style={{ color: "#9A9A96", fontSize: 14 }}>{label}</dt>
                    <dd style={{ fontWeight: 700, wordBreak: "break-all" }}>{value}</dd>
                  </div>
                ))}
              </dl>
              {data.bank.notes ? (
                <p style={{ color: "#F0F0EE", fontSize: 15, marginTop: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {data.bank.notes}
                </p>
              ) : null}
              <p style={{ color: "#9A9A96", fontSize: 15, marginTop: 12, lineHeight: 1.5 }}>
                Transferí el monto exacto de cada período y subí el comprobante.
              </p>
            </>
          ) : (
            <p style={{ color: "#f59e0b", fontSize: 16, marginTop: 8, lineHeight: 1.5 }}>
              El administrador todavía no configuró los datos bancarios. Contactalo para recibir la información.
            </p>
          )}
        </Card>
      </div>

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
