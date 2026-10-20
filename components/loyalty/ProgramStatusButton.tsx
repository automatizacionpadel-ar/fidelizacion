"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ProgramStatusButton({
  programId,
  cardTitle,
  status,
}: {
  programId: string;
  cardTitle: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = status === "active";
  const label = active ? "Pausar" : status === "paused" ? "Activar" : "Publicar";

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const action = active ? "pause" : "publish";
      const res = await fetch(`/api/loyalty/programs/${programId}/${action}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo cambiar el estado.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <Button
        variant={active ? "secondary" : "primary"}
        disabled={busy}
        onClick={run}
        title={`${label} "${cardTitle}"`}
      >
        {busy ? "Guardando…" : label}
      </Button>
      {error ? <span style={{ color: "#f87171", fontSize: 12, maxWidth: 260 }}>{error}</span> : null}
    </div>
  );
}
