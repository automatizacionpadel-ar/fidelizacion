"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/panel/icons";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Papelera para la lista de tarjetas: abre el modal de eliminación
// (hay que escribir el título para confirmar). Al borrar redirige/refresca.
export function DeleteProgramIconButton({
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
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        title={`Eliminar "${cardTitle}"`}
        aria-label={`Eliminar "${cardTitle}"`}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          border: "1px solid #3D3D3B",
          background: "transparent",
          color: "#f87171",
          cursor: "pointer",
        }}
      >
        <TrashIcon size={18} />
      </button>
      <ConfirmModal
        open={open}
        title={`Eliminar "${cardTitle}"`}
        body={
          <>
            Se borran sus tarjetas ({clients} cliente(s)), historial, suscripciones y archivos.
            Los miembros del negocio se conservan.
            <br />
            <strong style={{ color: "#F0F0EE" }}>Esta acción no se puede deshacer.</strong>
            {error && <span style={{ display: "block", color: "#f87171", marginTop: 8 }}>{error}</span>}
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
