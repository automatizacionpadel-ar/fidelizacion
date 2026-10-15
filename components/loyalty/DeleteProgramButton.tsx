"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Zona de peligro: elimina el programa con TODO (tarjetas, historial,
// suscripciones push y archivos del bucket). Modal con texto a escribir.
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function destroy() {
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
      setOpen(false);
    }
  }

  return (
    <>
      <Card style={{ marginTop: 24, borderColor: "#f87171" }}>
        <h3 style={{ fontWeight: 800, color: "#f87171" }}>Zona de peligro</h3>
        <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6 }}>
          Elimina la tarjeta con sus {clients} cliente(s), historial y archivos. No se puede deshacer.
        </p>
        {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => setOpen(true)} style={{ background: "#f87171", borderColor: "#f87171", color: "#20201F" }}>
            Eliminar tarjeta para siempre
          </Button>
        </div>
      </Card>
      <ConfirmModal
        open={open}
        title={`Eliminar "${cardTitle}"`}
        body={
          <>
            Se borran sus tarjetas ({clients} cliente(s)), historial, suscripciones y archivos.
            Los miembros del negocio se conservan.
            <br />
            <strong style={{ color: "#F0F0EE" }}>Esta acción no se puede deshacer.</strong>
          </>
        }
        confirmLabel="Sí, eliminar todo"
        danger
        busy={busy}
        requireText={cardTitle}
        onConfirm={destroy}
        onCancel={() => !busy && setOpen(false)}
      />
    </>
  );
}
