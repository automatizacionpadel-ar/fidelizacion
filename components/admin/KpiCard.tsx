import { Card } from "@/components/ui/Card";

export function KpiCard({
  label,
  value,
  hint,
  accent = "#7AB619",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card style={{ padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: "#9A9A96", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: accent, marginTop: 6, lineHeight: 1.1 }}>
        {value}
      </p>
      {hint ? <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4 }}>{hint}</p> : null}
    </Card>
  );
}
