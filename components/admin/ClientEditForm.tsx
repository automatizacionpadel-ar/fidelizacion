"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { AdminBusinessRow } from "@/lib/admin/types";

export function ClientEditForm({
  client,
  allies,
  onClose,
}: {
  client: AdminBusinessRow;
  allies: { id: string; name: string; status: string }[];
  onClose?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: client.name,
    slug: client.slug,
    plan: client.plan,
    allyId: client.ally_id ?? "",
    notes: client.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setOk(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          plan: form.plan,
          allyId: form.allyId || null,
          notes: form.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar.");
      setOk(true);
      router.refresh();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <div>
        <Label htmlFor="edit-name">Nombre</Label>
        <Input id="edit-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="edit-slug">Slug</Label>
        <Input id="edit-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="edit-plan">Plan</Label>
        <select id="edit-plan" value={form.plan} onChange={(e) => set("plan", e.target.value)} style={selectStyle}>
          <option value="base">Básico</option>
          <option value="pro">Pro</option>
        </select>
      </div>
      <div>
        <Label htmlFor="edit-ally">Aliado</Label>
        <select id="edit-ally" value={form.allyId} onChange={(e) => set("allyId", e.target.value)} style={selectStyle}>
          <option value="">Sin aliado</option>
          {allies.map((a) => <option key={a.id} value={a.id}>{a.name}{a.status === "suspended" ? " (suspendido)" : ""}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="edit-notes">Notas internas</Label>
        <textarea id="edit-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...selectStyle, resize: "vertical" }} />
      </div>
      {error ? <p className="md:col-span-2" style={{ color: "#f87171", fontSize: 14 }}>{error}</p> : null}
      {ok ? <p className="md:col-span-2" style={{ color: "#7AB619", fontSize: 14 }}>Cambios guardados.</p> : null}
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {onClose ? <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button> : null}
      </div>
    </form>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#20201F",
  color: "#F0F0EE",
  border: "1px solid #3D3D3B",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
};
