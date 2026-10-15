"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Zona de peligro: elimina el programa con TODO (tarjetas, historial,
// suscripciones push y archivos del bucket). Doble confirmación.
export function DeleteProgramButton({
  programId,
  cardTitle,
  clients,
}: {
  programId: string;
  cardTitle: string;
  clients: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function destroy() {
    if (
      !confirm(
        `¿Eliminar "${cardTitle}" para siempre?\n\nSe borran sus tarjetas (${clients} cliente(s)), historial, suscripciones y archivos. Los miembros del negocio se conservan.\n\nEsta acción NO se puede deshacer.`
      )
    )
      return;
    if (!confirm("Confirmá de nuevo: ¿sí, eliminar todo?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/programs/${programId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo eliminar.");
      router.push("/panel/tarjetas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      setBusy(false);
    }
  }

  return (
    <Card style={{ marginTop: 24, borderColor: "#f87171" }}>
      <h3 style={{ fontWeight: 800, color: "#f87171" }}>Zona de peligro</h3>
      <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6 }}>
        Elimina la tarjeta con sus {clients} cliente(s), historial y archivos. No se puede deshacer.
      </p>
      {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 8 }}>{error}</p>}
      <div style={{ marginTop: 12 }}>
        <Button disabled={busy} onClick={destroy} style={{ background: "#f87171", borderColor: "#f87171", color: "#20201F" }}>
          {busy ? "Eliminando..." : "Eliminar tarjeta para siempre"}
        </Button>
      </div>
    </Card>
  );
}
