"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function PaymentReceiptForm({
  paymentId,
  onUploaded,
}: {
  paymentId: string;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Adjuntá el comprobante.");
      return;
    }
    if (!ALLOWED.includes(file.type) && !/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
      setError("El comprobante debe ser PDF, JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("El comprobante no puede pesar más de 5 MB.");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.set("paymentId", paymentId);
      body.set("file", file);
      body.set("note", note);
      const res = await fetch("/api/billing/receipt", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo enviar el comprobante.");
      setFile(null);
      setNote("");
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el comprobante.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12 }}>
      <div>
        <Label htmlFor={`receipt-${paymentId}`}>Comprobante</Label>
        <input
          id={`receipt-${paymentId}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ width: "100%", color: "#F0F0EE", fontSize: 14 }}
        />
        <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 4 }}>PDF o imagen, hasta 5 MB.</p>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label htmlFor={`note-${paymentId}`}>Nota (opcional)</Label>
        <Input
          id={`note-${paymentId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Transferencia del 20/10"
        />
      </div>
      {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
      <div style={{ marginTop: 12 }}>
        <Button type="submit" disabled={saving}>
          {saving ? "Enviando…" : "Enviar comprobante"}
        </Button>
      </div>
    </form>
  );
}
