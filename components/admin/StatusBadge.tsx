export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "#7AB619", color: "#20201F", label: "Activo" },
    suspended: { bg: "#f87171", color: "#20201F", label: "Suspendido" },
    draft: { bg: "#5C5C59", color: "#F0F0EE", label: "Borrador" },
    paused: { bg: "#3B82F6", color: "#F0F0EE", label: "Pausado" },
  };
  const s = map[status] ?? { bg: "#3D3D3B", color: "#F0F0EE", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span style={{ background: "#3D3D3B", color: "#F0F0EE", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "2px 10px", textTransform: "capitalize" }}>
      {plan}
    </span>
  );
}
