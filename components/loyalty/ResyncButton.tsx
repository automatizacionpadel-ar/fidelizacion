"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ResyncButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/cards/${cardId}/resync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falló la sincronización.");
      setMsg("Wallet sincronizada ✅ (reabrí Google Wallet en unos minutos)");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falló la sincronización.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <Button variant="secondary" onClick={run} disabled={busy}>
        {busy ? "Sincronizando..." : "Re-sincronizar Wallet"}
      </Button>
      {msg && <p style={{ color: "#7AB619", fontSize: 13, marginTop: 6 }}>{msg}</p>}
      {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
