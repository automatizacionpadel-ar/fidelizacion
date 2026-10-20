"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Table } from "@/components/ui/Table";
import { formatMoney, periodLabel } from "@/lib/billing";
import type { AdminPayment } from "@/lib/admin/types";

function statusLabel(status: AdminPayment["status"]): string {
  if (status === "paid") return "Pagado";
  if (status === "pending_review") return "En revisión";
  return "Pendiente";
}

function statusStyle(status: AdminPayment["status"]): React.CSSProperties {
  if (status === "paid") return { background: "#7AB619", color: "#20201F" };
  if (status === "pending_review") return { background: "#b45309", color: "#F0F0EE" };
  return { background: "#3D3D3B", color: "#9A9A96" };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPaymentsPanel({ payments }: { payments: AdminPayment[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<AdminPayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${target.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo confirmar el pago.");
      setTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar el pago.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Table
        head={["Período", "Monto", "Estado", "Comprobante", "Enviado", "Acciones"]}
        rows={payments.map((p) => [
          periodLabel(p.period),
          formatMoney(Number(p.amount)),
          <span
            key={`status-${p.id}`}
            style={{
              ...statusStyle(p.status),
              display: "inline-block",
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {statusLabel(p.status)}
          </span>,
          p.receipt_url ? (
            <a
              key={`receipt-${p.id}`}
              href={p.receipt_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#7AB619", textDecoration: "underline" }}
            >
              {p.receipt_name || "Ver comprobante"}
            </a>
          ) : (
            "—"
          ),
          formatDateTime(p.submitted_at),
          p.status === "paid" ? (
            <span key={`paid-${p.id}`} style={{ fontSize: 12, color: "#9A9A96" }}>
              Confirmado {formatDateTime(p.paid_at)}
            </span>
          ) : (
            <button
              key={`action-${p.id}`}
              type="button"
              onClick={() => {
                setError(null);
                setTarget(p);
              }}
              style={{
                border: "1px solid #7AB619",
                background: "transparent",
                color: "#7AB619",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Marcar pagado y activar
            </button>
          ),
        ])}
      />
      {error && !target ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}

      <ConfirmModal
        open={!!target}
        title={target ? `Confirmar pago de ${periodLabel(target.period)}` : "Confirmar pago"}
        body={
          <div>
            <p>
              Se marca el pago de <strong>{target ? formatMoney(Number(target.amount)) : ""}</strong> como pagado
              y el negocio se activa automáticamente.
            </p>
            {target && !target.receipt_url ? (
              <p style={{ marginTop: 8, color: "#f59e0b" }}>
                Este pago no tiene comprobante. Confirmalo solo si verificaste la transferencia.
              </p>
            ) : null}
            {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
          </div>
        }
        confirmLabel="Confirmar pago y activar"
        busy={busy}
        onConfirm={markPaid}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
