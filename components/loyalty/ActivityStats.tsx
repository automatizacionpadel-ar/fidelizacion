"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

type ActivityResponse = {
  points: string[];
  window_days: number;
  sampled: boolean;
};

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const BAR_REST = "#4B4B48";
const BAR_PEAK = "#7AB619";

function Bars({
  values,
  labels,
  formatPeak,
}: {
  values: number[];
  labels: string[];
  formatPeak?: (index: number) => string;
}) {
  const max = Math.max(...values, 1);
  const peak = values.indexOf(max);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end"
            style={{ height: "100%", minWidth: 0 }}
            title={`${labels[i]}: ${v}`}
          >
            <div
              style={{
                width: "100%",
                height: v > 0 ? `${Math.max(6, Math.round((v / max) * 100))}%` : 3,
                background: i === peak && v > 0 ? BAR_PEAK : BAR_REST,
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1" style={{ marginTop: 6 }}>
        {labels.map((l, i) => (
          <div
            key={i}
            className="flex-1 text-center"
            style={{
              fontSize: 10,
              color: i === peak ? "#F0F0EE" : "#9A9A96",
              fontWeight: i === peak ? 700 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {l}
          </div>
        ))}
      </div>
      {formatPeak && max > 0 && (
        <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 8 }}>
          Pico: <strong style={{ color: "#F0F0EE" }}>{formatPeak(peak)}</strong> con {max} escaneos
        </p>
      )}
    </div>
  );
}

export function ActivityStats() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/loyalty/activity")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const hours = new Array(24).fill(0) as number[];
    const days = new Array(7).fill(0) as number[];
    const trend: { key: string; label: string; value: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      trend.push({
        key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        value: 0,
      });
    }
    const trendIndex = new Map(trend.map((t, i) => [t.key, i]));
    for (const iso of data.points) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      hours[d.getHours()] += 1;
      days[(d.getDay() + 6) % 7] += 1;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const idx = trendIndex.get(key);
      if (idx !== undefined) trend[idx].value += 1;
    }
    const total = data.points.length;
    const peakHour = hours.indexOf(Math.max(...hours));
    const peakDay = days.indexOf(Math.max(...days));
    return { hours, days, trend, total, peakHour, peakDay };
  }, [data]);

  if (failed) return null;
  if (!data || !stats) {
    return (
      <Card style={{ marginTop: 16 }}>
        <p style={{ fontSize: 14, color: "#9A9A96" }}>Cargando estadísticas…</p>
      </Card>
    );
  }

  if (stats.total === 0) {
    return (
      <Card style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>Actividad de escaneos</h2>
        <p style={{ fontSize: 14, color: "#9A9A96", marginTop: 8 }}>
          Todavía no hay escaneos en los últimos {data.window_days} días. Cuando empieces a sumar
          sellos o canjes con el QR, acá vas a ver tus horarios y días pico.
        </p>
      </Card>
    );
  }

  const hourLabels = Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? `${h}h` : ""));

  return (
    <div style={{ marginTop: 16 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Actividad de escaneos</h2>
        <p style={{ fontSize: 12, color: "#9A9A96" }}>
          {stats.total} escaneos · últimos {data.window_days} días
          {data.sampled ? " (muestra)" : ""}
        </p>
      </div>
      <p style={{ fontSize: 13, color: "#9A9A96", marginTop: 4 }}>
        Hora pico:{" "}
        <strong style={{ color: "#F0F0EE" }}>
          {stats.peakHour}–{(stats.peakHour + 1) % 24}h
        </strong>{" "}
        · Día pico:{" "}
        <strong style={{ color: "#F0F0EE" }}>{DAY_LABELS[stats.peakDay]}</strong>
      </p>

      <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 12 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800 }}>Horas con más escaneos</h3>
          <p style={{ fontSize: 12, color: "#9A9A96", marginBottom: 12 }}>
            Cuándo pasan tus clientes por el mostrador.
          </p>
          <Bars
            values={stats.hours}
            labels={hourLabels}
            formatPeak={(i) => `${i}–${(i + 1) % 24}h`}
          />
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800 }}>Días más escaneados</h3>
          <p style={{ fontSize: 12, color: "#9A9A96", marginBottom: 12 }}>
            Qué días de la semana rinden más.
          </p>
          <Bars
            values={stats.days}
            labels={DAY_LABELS}
            formatPeak={(i) => DAY_LABELS[i]}
          />
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800 }}>Últimos 14 días</h3>
        <p style={{ fontSize: 12, color: "#9A9A96", marginBottom: 12 }}>
          Evolución diaria de escaneos.
        </p>
        <Bars values={stats.trend.map((t) => t.value)} labels={stats.trend.map((t) => t.label)} />
      </Card>
    </div>
  );
}
