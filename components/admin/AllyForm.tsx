"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { AllyRecord } from "@/lib/auth/roles";

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#20201F",
  color: "#F0F0EE",
  border: "1px solid #3D3D3B",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
};

export function AllyCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    contactName: "",
    phone: "",
    email: "",
    taxId: "",
    commissionRate: "10",
    mode: "invite",
    password: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/allies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: form.contactName,
          phone: form.phone,
          email: form.email,
          taxId: form.taxId,
          commissionRate: Number(form.commissionRate) || 0,
          notes: form.notes,
          access: { mode: form.mode, password: form.mode === "password" ? form.password : undefined },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear el aliado.");
      router.push(`/admin/aliados/${json.ally.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el aliado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="contactName">Contacto</Label>
        <Input id="contactName" required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Nombre y apellido" />
      </div>
      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="taxId">CUIT</Label>
        <Input id="taxId" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="commissionRate">Comisión (%)</Label>
        <Input id="commissionRate" type="number" min={0} max={100} step="0.01" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="mode">Acceso del aliado</Label>
        <select id="mode" value={form.mode} onChange={(e) => set("mode", e.target.value)} style={selectStyle}>
          <option value="invite">Invitar por email</option>
          <option value="password">Contraseña temporal</option>
        </select>
      </div>
      {form.mode === "password" ? (
        <div>
          <Label htmlFor="password">Contraseña temporal</Label>
          <Input id="password" type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <p style={{ fontSize: 12, color: "#9A9A96", lineHeight: 1.5 }}>
            Se envía una invitación con enlace a <code>/auth/continue</code>.
          </p>
        </div>
      )}
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notas internas</Label>
        <textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...selectStyle, resize: "vertical" }} />
      </div>
      {error ? <p className="md:col-span-2" style={{ color: "#f87171", fontSize: 14 }}>{error}</p> : null}
      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear aliado"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/aliados")}>Cancelar</Button>
      </div>
    </form>
  );
}

export function AllyEditForm({ ally, onClose }: { ally: AllyRecord; onClose?: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: ally.name,
    legalName: ally.legal_name,
    taxId: ally.tax_id,
    contactName: ally.contact_name,
    email: ally.email,
    phone: ally.phone,
    commissionRate: String(ally.commission_rate),
    notes: ally.notes,
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
      const res = await fetch(`/api/admin/allies/${ally.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          legalName: form.legalName,
          taxId: form.taxId,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          commissionRate: Number(form.commissionRate) || 0,
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
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="e-name">Nombre comercial</Label>
        <Input id="e-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-legal">Razón social</Label>
        <Input id="e-legal" value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-tax">CUIT</Label>
        <Input id="e-tax" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-contact">Contacto</Label>
        <Input id="e-contact" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-email">Email</Label>
        <Input id="e-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-phone">Teléfono</Label>
        <Input id="e-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="e-commission">Comisión (%)</Label>
        <Input id="e-commission" type="number" min={0} max={100} step="0.01" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <p style={{ fontSize: 12, color: "#9A9A96" }}>
          El cambio de email comercial no modifica el email de acceso.
        </p>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="e-notes">Notas internas</Label>
        <textarea id="e-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...selectStyle, resize: "vertical" }} />
      </div>
      {error ? <p className="md:col-span-2" style={{ color: "#f87171", fontSize: 14 }}>{error}</p> : null}
      {ok ? <p className="md:col-span-2" style={{ color: "#7AB619", fontSize: 14 }}>Cambios guardados.</p> : null}
      <div className="md:col-span-2 flex flex-wrap gap-2" style={{ borderTop: "1px solid #3D3D3B", paddingTop: 16, marginTop: 4 }}>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {onClose ? <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button> : null}
      </div>
    </form>
  );
}
