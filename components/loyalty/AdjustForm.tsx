"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function AdjustForm({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/loyalty/cards/${cardId}/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo ajustar.");
      setOk(`Ajuste listo. Balance: ${json.balance}`);
      setAmount("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" style={{ marginTop: 10 }}>
      <div><Label>Cantidad (+ suma / − resta)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej. 2 o -1" required /></div>
      <div><Label>Nota (obligatoria)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo del ajuste" required /></div>
      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
      {ok && <p style={{ color: "#7AB619", fontSize: 13 }}>{ok}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Guardando..." : "Guardar ajuste"}</Button>
    </form>
  );
}
