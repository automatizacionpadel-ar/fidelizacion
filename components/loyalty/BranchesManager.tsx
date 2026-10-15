"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type Branch = { id: string; name: string; address: string; phone: string };

// ABM simple de sucursales. Cada sucursal opera individual: los programas
// se asignan a UNA sucursal y las tarjetas no valen entre sucursales.
export function BranchesManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/loyalty/branches");
      if (res.ok) {
        const json = await res.json();
        setBranches(json.branches ?? []);
      }
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/loyalty/branches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, address, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear.");
      setName("");
      setAddress("");
      setPhone("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <h2 style={{ fontWeight: 800 }}>Mis sucursales</h2>
        {branches.length === 0 ? (
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 8 }}>
            Todavía no hay sucursales. Si tenés un solo local, creá una igual (ej. "Casa central"):
            cada tarjeta pertenece a una sucursal.
          </p>
        ) : (
          <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
            {branches.map((b) => (
              <div key={b.id} style={{ border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px" }}>
                <strong>{b.name}</strong>
                {(b.address || b.phone) && (
                  <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 2 }}>
                    {[b.address, b.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <h2 style={{ fontWeight: 800 }}>Nueva sucursal</h2>
        <form onSubmit={create} className="flex flex-col gap-3" style={{ marginTop: 12 }}>
          <div>
            <Label>Nombre</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sucursal Centro" />
          </div>
          <div>
            <Label>Dirección (opcional)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej. Av. Siempre Viva 123" />
          </div>
          <div>
            <Label>Teléfono (opcional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. 11 5555 5555" inputMode="tel" />
          </div>
          {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? "Creando..." : "Crear sucursal"}</Button>
        </form>
      </Card>
    </div>
  );
}
