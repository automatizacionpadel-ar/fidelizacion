"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { ClientEditForm } from "@/components/admin/ClientEditForm";
import { EyeIcon, PauseIcon, PencilIcon, PlayIcon, TrashIcon } from "@/components/panel/icons";
import type { AdminBusinessRow } from "@/lib/admin/types";

const buttonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid transparent",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export function ClientRowActions({
  client,
  allies,
}: {
  client: AdminBusinessRow;
  allies: { id: string; name: string; status: string }[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [modal, setModal] = useState<"suspend" | "resume" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: "active" | "suspended") {
    setError(null);
    if (status === "suspended" && !reason.trim()) {
      setError("Indicá el motivo de la suspensión.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, reason: status === "suspended" ? reason : undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cambiar el estado.");
      setModal(null);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmSlug: client.slug, deleteOwnerAccount: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo eliminar.");
      setModal(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Link
        href={`/admin/clientes/${client.id}`}
        aria-label={`Ver ${client.name}`}
        title="Ver"
        style={{ ...buttonStyle, color: "#7AB619" }}
      >
        <EyeIcon size={18} />
      </Link>

      <button
        type="button"
        aria-label={`Editar ${client.name}`}
        title="Editar"
        onClick={() => setEditOpen(true)}
        style={{ ...buttonStyle, color: "#F0F0EE" }}
      >
        <PencilIcon size={17} />
      </button>

      {client.status === "active" ? (
        <button
          type="button"
          aria-label={`Suspender ${client.name}`}
          title="Suspender"
          onClick={() => { setError(null); setReason(""); setModal("suspend"); }}
          style={{ ...buttonStyle, color: "#f87171" }}
        >
          <PauseIcon size={17} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Reactivar ${client.name}`}
          title="Reactivar"
          onClick={() => { setError(null); setModal("resume"); }}
          style={{ ...buttonStyle, color: "#7AB619" }}
        >
          <PlayIcon size={16} />
        </button>
      )}

      <button
        type="button"
        aria-label={`Eliminar ${client.name}`}
        title="Eliminar"
        onClick={() => { setError(null); setModal("delete"); }}
        style={{ ...buttonStyle, color: "#f87171" }}
      >
        <TrashIcon size={17} />
      </button>

      <Modal open={editOpen} title={`Editar ${client.name}`} onClose={() => setEditOpen(false)} maxWidth={640}>
        <ClientEditForm client={client} allies={allies} onClose={() => setEditOpen(false)} />
      </Modal>

      <ConfirmModal
        open={modal === "suspend"}
        title={`Suspender ${client.name}`}
        body={
          <div>
            <p>
              Se bloquean altas, sellados, canjes, edición de tarjetas y avisos.
              El cliente conserva acceso de lectura y puede subir comprobantes de pago.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Motivo (obligatorio)"
              style={{ width: "100%", marginTop: 12, background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 16, resize: "vertical" }}
            />
            {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
          </div>
        }
        confirmLabel="Suspender"
        danger
        busy={busy}
        onConfirm={() => changeStatus("suspended")}
        onCancel={() => setModal(null)}
      />

      <ConfirmModal
        open={modal === "resume"}
        title={`Reactivar ${client.name}`}
        body={
          <div>
            <p>El cliente recuperará todas sus operaciones de fidelización.</p>
            {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
          </div>
        }
        confirmLabel="Reactivar"
        busy={busy}
        onConfirm={() => changeStatus("active")}
        onCancel={() => setModal(null)}
      />

      <ConfirmModal
        open={modal === "delete"}
        title={`Eliminar ${client.name}`}
        body={
          <div>
            <p>
              Esta acción es irreversible: se eliminan programas, miembros, tarjetas,
              transacciones, pagos y archivos del negocio.
            </p>
            <p style={{ marginTop: 8 }}>
              Si el dueño no tiene otros negocios, también se elimina su cuenta de acceso.
            </p>
            {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
          </div>
        }
        confirmLabel="Eliminar definitivamente"
        requireText={client.slug}
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
