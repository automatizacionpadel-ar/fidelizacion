import type { ActivityPoint } from "@/lib/admin/kpis";

export function ActivityBars({ points }: { points: ActivityPoint[] }) {
  const max = Math.max(...points.map((p) => p.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 140 }}>
        {points.map((p) => (
          <div
            key={p.date}
            className="flex-1 flex flex-col items-center justify-end"
            style={{ height: "100%", minWidth: 0 }}
            title={`${p.date}: ${p.count}`}
          >
            <div
              style={{
                width: "100%",
                height: p.count > 0 ? `${Math.max(4, Math.round((p.count / max) * 100))}%` : 3,
                background: p.count > 0 ? "#7AB619" : "#4B4B48",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between" style={{ marginTop: 8, fontSize: 11, color: "#9A9A96" }}>
        <span>{points[0]?.date.slice(5)}</span>
        <span>{points[Math.floor(points.length / 2)]?.date.slice(5)}</span>
        <span>{points[points.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
