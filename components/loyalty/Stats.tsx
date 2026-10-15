"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

export function Stats() {
  const [s, setS] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch("/api/loyalty/stats").then((r) => r.json()).then(setS).catch(() => {});
  }, []);
  if (!s) return null;
  const items: [string, string][] = [
    ["Tarjetas emitidas", String(s.cards_issued ?? 0)],
    ["Sellos/puntos del mes", String(s.earned_month ?? 0)],
    ["Premios canjeados (mes)", String(s.redeemed_month ?? 0)],
    ["Clientes activos (30d)", String(s.active_30d ?? 0)],
    ["Sin volver (30d+)", String(s.dormant_30d ?? 0)],
  ];
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-5" style={{ marginTop: 20 }}>
      {items.map(([label, value]) => (
        <Card key={label} style={{ padding: 14 }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#7AB619" }}>{value}</p>
          <p style={{ fontSize: 12, color: "#9A9A96" }}>{label}</p>
        </Card>
      ))}
    </div>
  );
}
