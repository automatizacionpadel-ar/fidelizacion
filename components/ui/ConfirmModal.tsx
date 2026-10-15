"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

// Modal de confirmación propio (no usar window.alert/confirm en la app).
// Para acciones destructivas se puede exigir escribir un texto.
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Confirmar",
  busy = false,
  danger = false,
  requireText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  danger?: boolean;
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const canConfirm = !requireText || typed.trim() === requireText;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "#2A2A29", color: "#F0F0EE",
          border: `1px solid ${danger ? "#f87171" : "#3D3D3B"}`,
          borderRadius: 14, padding: 20, width: "100%", maxWidth: 440,
          boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
        }}
      >
        <h3 style={{ fontWeight: 800, fontSize: 18, color: danger ? "#f87171" : "#F0F0EE" }}>{title}</h3>
        <div style={{ fontSize: 14, color: "#9A9A96", marginTop: 8, lineHeight: 1.6 }}>{body}</div>
        {requireText && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, marginBottom: 6 }}>
              Escribí <strong style={{ color: "#F0F0EE" }}>{requireText}</strong> para confirmar:
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireText}
              style={{
                width: "100%", background: "#20201F", color: "#F0F0EE",
                border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 16,
              }}
            />
          </div>
        )}
        <div className="flex gap-2" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy || !canConfirm}
            style={danger ? { background: "#f87171", borderColor: "#f87171", color: "#20201F" } : undefined}
          >
            {busy ? "Procesando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
