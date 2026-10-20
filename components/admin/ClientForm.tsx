"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function ClientCreateForm({
  allies,
}: {
  allies: { id: string; name: string; status: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    plan: "base",
    allyId: "",
    notes: "",
    mode: "invite",
    password: "",
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
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug.trim() || undefined,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          plan: form.plan,
          allyId: form.allyId || null,
          notes: form.notes,
          access: { mode: form.mode, password: form.mode === "password" ? form.password : undefined },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear el cliente.");
      router.push(`/admin/clientes/${json.client.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Café de barrio" />
      </div>
      <div>
        <Label htmlFor="slug">Slug (opcional)</Label>
        <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="cafe-de-barrio" />
      </div>
      <div>
        <Label htmlFor="ownerName">Nombre del dueño</Label>
        <Input id="ownerName" required value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Martín Gómez" />
      </div>
      <div>
        <Label htmlFor="ownerEmail">Email del dueño</Label>
        <Input id="ownerEmail" type="email" required value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} placeholder="dueno@negocio.com" />
      </div>
      <div>
        <Label htmlFor="plan">Plan</Label>
        <select id="plan" value={form.plan} onChange={(e) => set("plan", e.target.value)} style={selectStyle}>
          <option value="base">Base</option>
          <option value="pro">Pro</option>
        </select>
      </div>
      <div>
        <Label htmlFor="allyId">Aliado</Label>
        <select id="allyId" value={form.allyId} onChange={(e) => set("allyId", e.target.value)} style={selectStyle}>
          <option value="">Sin aliado</option>
          {allies.filter((a) => a.status === "active").map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notas internas</Label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          style={{ ...selectStyle, resize: "vertical" }}
          placeholder="Datos de contacto, contexto comercial, etc."
        />
      </div>
      <div>
        <Label htmlFor="mode">Acceso del dueño</Label>
        <select id="mode" value={form.mode} onChange={(e) => set("mode", e.target.value)} style={selectStyle}>
          <option value="invite">Invitar por email</option>
          <option value="password">Contraseña temporal</option>
        </select>
      </div>
      {form.mode === "password" ? (
        <div>
          <Label htmlFor="password">Contraseña temporal</Label>
          <Input id="password" type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <p style={{ fontSize: 12, color: "#9A9A96", lineHeight: 1.5 }}>
            Supabase enviará una invitación con enlace a <code>/auth/continue</code>.
          </p>
        </div>
      )}
      {error ? <p className="md:col-span-2" style={{ color: "#f87171", fontSize: 14 }}>{error}</p> : null}
      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear cliente"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/clientes")}>Cancelar</Button>
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
