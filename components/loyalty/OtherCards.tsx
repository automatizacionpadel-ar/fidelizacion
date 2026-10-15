"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { subscribePush } from "@/lib/push/subscribeClient";

type Other = { id: string; slug: string; card_title: string };

// Desde su tarjeta existente, el cliente suma otras tarjetas del negocio
// con un toque, sin reingresar datos (el token lo identifica).
export function OtherCards({ token }: { token: string }) {
  const [others, setOthers] = useState<Other[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/loyalty/cards/others?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => setOthers(json.cards ?? []))
      .catch(() => setOthers([]));
  }, [token]);

  async function take(card: Other) {
    setBusy(card.slug);
    setError(null);
    try {
      const res = await fetch("/api/loyalty/enroll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: card.slug, card_token: token, website: "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No pudimos generarla.");
      await subscribePush(json.card_token).catch(() => false);
      window.location.href = json.card_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setBusy(null);
    }
  }

  if (!others || others.length === 0) return null;

  return (
    <div style={{ marginTop: 18, border: "1px solid rgba(128,128,128,0.4)", borderRadius: 14, padding: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Otras tarjetas del negocio 🎴</h3>
      <p style={{ fontSize: 13, opacity: 0.75, margin: "4px 0 12px" }}>
        Ya estás registrado: sumalas sin completar tus datos.
      </p>
      <div className="flex flex-col gap-2">
        {others.map((c) => (
          <Button key={c.id} variant="secondary" disabled={busy !== null} onClick={() => take(c)}>
            {busy === c.slug ? "Generando..." : `Obtener: ${c.card_title}`}
          </Button>
        ))}
      </div>
      {error && <p style={{ fontSize: 13, color: "#f87171", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
