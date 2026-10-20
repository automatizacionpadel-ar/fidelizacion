"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { AllyRecord } from "@/lib/auth/roles";

export function AllyProfileForm({ ally }: { ally: AllyRecord }) {
  const router = useRouter();
  const [form, setForm] = useState({
    contactName: ally.contact_name,
    phone: ally.phone,
    legalName: ally.legal_name,
    taxId: ally.tax_id,
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
      const res = await fetch("/api/ally/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar.");
      setOk(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="contactName">Contacto</Label>
        <Input id="contactName" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="legalName">Razón social</Label>
        <Input id="legalName" value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="taxId">CUIT</Label>
        <Input id="taxId" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
      </div>
      {error ? <p className="md:col-span-2" style={{ color: "#f87171", fontSize: 14 }}>{error}</p> : null}
      {ok ? <p className="md:col-span-2" style={{ color: "#7AB619", fontSize: 14 }}>Datos actualizados.</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </form>
  );
}
