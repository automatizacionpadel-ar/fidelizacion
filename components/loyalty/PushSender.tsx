"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type Program = { id: string; card_title: string };

export function PushSender({ programs }: { programs: Program[] }) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Cuántos suscriptos por programa (best-effort, endpoint autenticado)
    programs.forEach(async (p) => {
      try {
        const res = await fetch(`/api/loyalty/push/count?program_id=${p.id}`);
        if (res.ok) {
          const json = await res.json();
          setCounts((c) => ({ ...c, [p.id]: json.count }));
        }
      } catch {}
    });
  }, [programs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/loyalty/push/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ program_id: programId, title, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo enviar.");
      setMsg(`Enviado a ${json.sent} de ${json.total} suscriptos ✅`);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar.");
    } finally {
      setBusy(false);
    }
  }

  if (programs.length === 0) {
    return (
      <Card><p style={{ color: "#9A9A96" }}>Primero creá y publicá una tarjeta.</p></Card>
    );
  }

  return (
    <Card style={{ maxWidth: 560 }}>
      <form onSubmit={send} className="flex flex-col gap-4">
        <div>
          <Label>Tarjeta</Label>
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} style={selectStyle}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.card_title}{counts[p.id] !== undefined ? ` (${counts[p.id]} suscriptos)` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Título</Label>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Tenés un premio esperándote 🎉" maxLength={80} />
        </div>
        <div>
          <Label>Mensaje</Label>
          <Input required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ej. Pasá hoy por tu café gratis." maxLength={200} />
        </div>
        {msg && <p style={{ color: "#7AB619", fontSize: 14 }}>{msg}</p>}
        {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar aviso"}</Button>
      </form>
      <p style={{ color: "#5C5C59", fontSize: 12, marginTop: 12 }}>
        Llega a los clientes que tocaron el botón de avisos en su tarjeta. Al tocar el aviso se abre su tarjeta.
      </p>
    </Card>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", background: "#20201F", color: "#F0F0EE",
  border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 15,
};
