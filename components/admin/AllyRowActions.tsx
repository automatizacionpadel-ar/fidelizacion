"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { AllyEditForm } from "@/components/admin/AllyForm";
import { EyeIcon, PauseIcon, PencilIcon, PlayIcon, TrashIcon } from "@/components/panel/icons";
import type { AllyRecord } from "@/lib/auth/roles";

type AllyRow = AllyRecord & { clients_count: number };

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

export function AllyRowActions({ ally }: { ally: AllyRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [modal, setModal] = useState<"suspend" | "resume" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: "active" | "suspended") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/allies/${ally.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo cambiar el estado.");
      setModal(null);
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
      const res = await fetch(`/api/admin/allies/${ally.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleteAccount: true }),
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
        href={`/admin/aliados/${ally.id}`}
        aria-label={`Ver ${ally.name}`}
        title="Ver"
        style={{ ...buttonStyle, color: "#7AB619" }}
      >
        <EyeIcon size={18} />
      </Link>

      <button
        type="button"
        aria-label={`Editar ${ally.name}`}
        title="Editar"
        onClick={() => setEditOpen(true)}
        style={{ ...buttonStyle, color: "#F0F0EE" }}
      >
        <PencilIcon size={17} />
      </button>

      {ally.status === "active" ? (
        <button
          type="button"
          aria-label={`Suspender ${ally.name}`}
          title="Suspender"
          onClick={() => { setError(null); setModal("suspend"); }}
          style={{ ...buttonStyle, color: "#f87171" }}
        >
          <PauseIcon size={17} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Reactivar ${ally.name}`}
          title="Reactivar"
          onClick={() => { setError(null); setModal("resume"); }}
          style={{ ...buttonStyle, color: "#7AB619" }}
        >
          <PlayIcon size={16} />
        </button>
      )}

      <button
        type="button"
        aria-label={`Eliminar ${ally.name}`}
        title="Eliminar"
        onClick={() => { setError(null); setModal("delete"); }}
        style={{ ...buttonStyle, color: "#f87171" }}
      >
        <TrashIcon size={17} />
      </button>

      <Modal open={editOpen} title={`Editar ${ally.name}`} onClose={() => setEditOpen(false)} maxWidth={640}>
        <AllyEditForm ally={ally} onClose={() => setEditOpen(false)} />
      </Modal>

      <ConfirmModal
        open={modal === "suspend"}
        title={`Suspender ${ally.name}`}
        body={
          <div>
            <p>El aliado no podrá entrar a su portal. Sus clientes siguen operando normalmente.</p>
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
        title={`Reactivar ${ally.name}`}
        body={
          <div>
            <p>El aliado recuperará el acceso a su cartera.</p>
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
        title={`Eliminar ${ally.name}`}
        body={
          <div>
            <p>
              Solo se puede eliminar si no tiene clientes asignados.
              Actualmente tiene {ally.clients_count} cliente(s).
            </p>
            <p style={{ marginTop: 8 }}>También se elimina su rol y, si elegís, su cuenta de acceso.</p>
            {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
          </div>
        }
        confirmLabel="Eliminar aliado"
        requireText={ally.name}
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
