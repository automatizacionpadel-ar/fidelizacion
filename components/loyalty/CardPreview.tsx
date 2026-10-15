import { Stamp } from "./Stamp";
import { CardProgress, CardShell } from "./CardShell";

export type PreviewProps = {
  cardTitle: string;
  cardType: "stamps" | "points";
  goal: number;
  balance?: number;
  rewardDescription: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl?: string | null;
  stampIcon?: string;
  stampImageUrl?: string | null;
  fontFamily?: string;
  template?: string | null;
};

// QR de ejemplo (mock visual, no codifica nada). Solo para la vista previa.
function MockQr({ size = 132 }: { size?: number }) {
  const n = 25;
  const cell = size / n;
  const cells: string[] = [];
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      // Patrones de timing (fila/columna 6) + relleno determinista.
      const timing = x === 6 || y === 6;
      const on = timing ? (x + y) % 2 === 0 : (x * 31 + y * 17 + x * y * 3) % 7 < 3;
      if (on) cells.push(`${x}-${y}`);
    }
  }
  const finder = (ox: number, oy: number) => (
    <g key={`f-${ox}-${oy}`}>
      <rect x={ox * cell} y={oy * cell} width={7 * cell} height={7 * cell} fill="#111" />
      <rect x={(ox + 1) * cell} y={(oy + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" />
      <rect x={(ox + 2) * cell} y={(oy + 2) * cell} width={3 * cell} height={3 * cell} fill="#111" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR de ejemplo">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((k) => {
        const [x, y] = k.split("-").map(Number);
        return <rect key={k} x={x * cell} y={y * cell} width={cell} height={cell} fill="#111" />;
      })}
      {finder(0, 0)}
      {finder(n - 7, 0)}
      {finder(0, n - 7)}
    </svg>
  );
}

export function CardPreview(p: PreviewProps) {
  const balance = Math.min(p.balance ?? Math.min(7, p.goal - 1), p.goal);
  const icon = p.stampIcon || "✓";
  const label = p.cardType === "stamps" ? "sellos" : "puntos";
  return (
    <CardShell
      template={p.template}
      backgroundColor={p.backgroundColor}
      textColor={p.textColor}
      accentColor={p.accentColor}
      fontFamily={p.fontFamily}
      radius={18}
      padding={22}
      shadow="0 8px 32px rgba(0,0,0,0.45)"
    >
      {/* 1. Logo primero */}
      <div style={{ textAlign: "center" }}>
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.logoUrl}
            alt="logo"
            style={{ width: "80%", aspectRatio: "16/9", borderRadius: 18, objectFit: "contain", display: "block", margin: "0 auto" }}
          />
        ) : (
          <div
            style={{
              width: "80%", aspectRatio: "16/9", borderRadius: 18, margin: "0 auto",
              background: p.accentColor, display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 800, fontSize: 56, color: "#20201F",
            }}
          >
            {(p.cardTitle || "F")[0]}
          </div>
        )}
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.2 }}>
          {p.cardTitle || "Tu tarjeta"}
        </h2>
      </div>

      {/* 2. Premio */}
      <div
        style={{
          marginTop: 18,
          border: `1px solid ${p.accentColor}`,
          background: "rgba(128,128,128,0.15)",
          borderRadius: 12,
          padding: "12px 14px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, margin: 0, color: p.accentColor }}>
          🎁 PREMIO
        </p>
        <p style={{ fontSize: 16, fontWeight: 800, margin: "4px 0 0" }}>
          {p.rewardDescription || "—"}
        </p>
      </div>

      {/* 3. Puntos */}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <p style={{ fontSize: 34, fontWeight: 800, margin: 0, lineHeight: 1 }}>
          {balance}<span style={{ fontSize: 18, opacity: 0.6 }}>/{p.goal}</span>
        </p>
        <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, margin: "4px 0 10px" }}>
          {label.toUpperCase()}
        </p>
        <div className="flex gap-2 flex-wrap" style={{ alignItems: "center", justifyContent: "center" }}>
          {p.cardType === "points" ? (
            <div style={{ flex: 1, minWidth: 200 }}>
              <CardProgress balance={balance} goal={p.goal} accentColor={p.accentColor} />
            </div>
          ) : (
            <>
              {Array.from({ length: Math.min(p.goal, 20) }).map((_, i) => (
                <Stamp key={i} earned={i < balance} icon={icon} imageUrl={p.stampImageUrl} size={34} />
              ))}
              {p.goal > 20 && <span style={{ fontSize: 13, opacity: 0.7 }}>+{p.goal - 20} más</span>}
            </>
          )}
        </div>
      </div>

      {/* QR de ejemplo */}
      <div style={{ marginTop: 18, borderTop: "1px dashed rgba(128,128,128,0.4)", paddingTop: 18, textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 12, display: "inline-block" }}>
          <MockQr />
        </div>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>QR de ejemplo — se genera al publicar</p>
      </div>
    </CardShell>
  );
}
