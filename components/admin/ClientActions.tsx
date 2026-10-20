"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ClientActions({
  client,
}: {
  client: { id: string; name: string; slug: string; status: string };
}) {
  const router = useRouter();
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
      router.push("/admin/clientes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {client.status === "active" ? (
          <Button variant="danger" onClick={() => { setModal("suspend"); setError(null); }}>
            Suspender cliente
          </Button>
        ) : (
          <Button onClick={() => { setModal("resume"); setError(null); }}>
            Reactivar cliente
          </Button>
        )}
        <Button variant="danger" onClick={() => { setModal("delete"); setError(null); }}>
          Eliminar definitivamente
        </Button>
      </div>
      {error && !modal ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}

      <ConfirmModal
        open={modal === "suspend"}
        title={`Suspender ${client.name}`}
        body={
          <div>
            <p>
              Se bloquean altas, sellados, canjes, edición de tarjetas y avisos.
              El cliente conserva acceso de lectura y puede registrar pagos.
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
        body={<p>El cliente recuperará todas sus operaciones de fidelización.</p>}
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
