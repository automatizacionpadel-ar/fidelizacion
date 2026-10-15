// Vista previa de la TARJETA WALLET (Google + Apple) con layout real.
//
// Lo que ve el cliente NO es la hero cruda que sube el negocio: por cada
// tarjeta se genera UNA imagen (logos/cards/{cardId}.png, 1032×812) que combina
// la hero de fondo + el progreso encima (sellos, barra, premio), y se
// sobrescribe con cada sello. Este mock replica esa imagen generada.
//
// GOOGLE WALLET · Loyalty:
// - Logo: PNG 660×660 (1:1), Google lo recorta en CÍRCULO (15% de margen).
// - Hero generada a ANCHO COMPLETO. Sin módulos de texto debajo: el progreso
//   vive en la imagen (quedan la fila nativa de puntos y el QR).
// - Solo se respeta el color de fondo; el texto lo elige Google.
//
// APPLE WALLET · Store Card (requiere Apple Developer, aún no conectado):
// - Logo rectangular chico arriba a la izquierda, sin recorte.
// - La misma imagen generada como strip (banner, recorte central) + QR.

export type WalletPreviewProps = {
  businessName?: string;
  cardTitle: string;
  cardType: "stamps" | "points";
  goal: number;
  rewardDescription: string;
  backgroundColor: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  stampIcon?: string | null;
  stampImageUrl?: string | null;
};

const MAX_STAMPS_ROW = 12;

// Google/Apple deciden texto blanco/negro por luminancia del fondo.
function autoTextOn(hex: string) {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#1F1F1F" : "#FFFFFF";
}

// Réplica fiel de la hero generada por tarjeta (ver lib/wallet/cardHero.ts):
// fondo (hero del negocio o color) + título + grilla de sellos + premio.
// Sin números ni barra: el progreso vive solo en los iconos.
function GeneratedHero({
  title,
  balance,
  goal,
  cardType,
  reward,
  rewards,
  bg,
  fg,
  accent,
  heroImageUrl,
  stampImageUrl,
  bleed,
}: {
  title: string;
  balance: number;
  goal: number;
  cardType: "stamps" | "points";
  reward: string;
  rewards: number;
  bg: string;
  fg: string;
  accent: string;
  heroImageUrl?: string | null;
  stampImageUrl?: string | null;
  bleed?: boolean;
}) {
  const done = Math.max(0, Math.min(balance, goal));
  // Igual que el generador: sellos en filas de 5 al 80% del ancho,
  // puntos en grilla adaptativa. Todo centrado.
  const cols =
    cardType === "points"
      ? goal <= MAX_STAMPS_ROW
        ? goal
        : goal <= 40
          ? 10
          : 20
      : Math.min(goal, 5);
  const rowCount = Math.ceil(goal / cols);
  const rows: { filled: boolean }[][] = Array.from({ length: rowCount }, (_, r) =>
    Array.from({ length: Math.min(cols, goal - r * cols) }, (_, k) => ({ filled: r * cols + k < done }))
  );
  const shown = rows.slice(0, 8);
  const cellPx = cols <= 5 ? 34 : cols <= 10 ? 20 : 13;
  return (
    <div
      style={{
        position: "relative",
        width: bleed ? "calc(100% + 32px)" : "100%",
        margin: bleed ? "12px -16px 0" : 0,
        aspectRatio: "1032/812",
        borderRadius: bleed ? 0 : 10,
        overflow: "hidden",
        background: bg,
      }}
    >
      {heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      {/* degradado para legibilidad cuando hay foto */}
      {heroImageUrl ? (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.75))",
          }}
        />
      ) : null}
      <div style={{ position: "relative", height: "100%", padding: "7%", color: fg, display: "flex", flexDirection: "column" }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, opacity: 0.85, margin: 0 }}>
          {title.toUpperCase().slice(0, 40) || "TU TARJETA"}
        </p>
        {/* sellos: imagen real del negocio o círculos, filas de 5 al 80% */}
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", alignContent: "center",
            gap: 6, padding: "4px 0", minHeight: 0,
          }}
        >
          {shown.map((row, r) => (
            <div key={r} className="flex" style={{ width: "80%", gap: 6, alignItems: "center", justifyContent: "center" }}>
              {row.map((c, k) =>
                stampImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={k}
                    src={stampImageUrl}
                    alt=""
                    style={{
                      width: cellPx, height: cellPx, objectFit: "contain", flexShrink: 0,
                      filter: c.filled ? "none" : "grayscale(1)",
                      opacity: c.filled ? 1 : 0.55,
                    }}
                  />
                ) : (
                  <div
                    key={k}
                    style={{
                      width: cellPx, height: cellPx, borderRadius: "50%", flexShrink: 0,
                      background: c.filled ? accent : "rgba(255,255,255,0.16)",
                    }}
                  />
                )
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, margin: 0, opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Premio: {reward || "—"}
        </p>
        {rewards > 0 ? (
          <div
            style={{
              marginTop: 6, alignSelf: "flex-start", background: accent, color: "#20201F",
              borderRadius: 7, padding: "4px 10px", fontWeight: 800, fontSize: 11,
            }}
          >
            {rewards} PREMIO{rewards > 1 ? "S" : ""} PARA CANJEAR
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function WalletPreview(p: WalletPreviewProps) {
  const bg = p.backgroundColor || "#2A2A29";
  const fg = autoTextOn(bg);
  const accent = "#7AB619";
  const balance = Math.min(3, Math.max(0, p.goal - 1));
  const title = p.cardTitle || "Tu tarjeta";
  const issuer = p.businessName || "Tu negocio";

  return (
    <div className="flex flex-col gap-5">
      {/* ——— Google Wallet · Loyalty ——— */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#9A9A96", margin: "0 0 6px" }}>
          GOOGLE WALLET · Loyalty
        </p>
        <div style={{ background: bg, color: fg, borderRadius: 16, padding: "16px 16px 16px", maxWidth: 320, overflow: "hidden" }}>
          {/* Cabecera real: logo circular + emisor + programa */}
          <div className="flex items-center gap-2">
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logoUrl}
                alt="logo"
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: "#fff", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%", background: "#fff", color: "#1F1F1F",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0,
                }}
              >
                {(issuer || "F")[0]}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, opacity: 0.75, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issuer}</p>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
            </div>
          </div>

          {/* Hero generada por tarjeta (ancho completo, progreso solo en iconos) */}
          <GeneratedHero
            title={title}
            balance={balance}
            goal={p.goal}
            cardType={p.cardType}
            reward={p.rewardDescription}
            rewards={0}
            bg={bg}
            fg={p.heroImageUrl ? "#FFFFFF" : fg}
            accent={accent}
            heroImageUrl={p.heroImageUrl}
            stampImageUrl={p.stampImageUrl}
            bleed
          />

          {/* Solo QR: el progreso ya vive en la imagen */}
          <div style={{ marginTop: 12, background: "#fff", borderRadius: 10, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#1F1F1F", fontWeight: 700 }}>QR · se genera al guardar</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#5C5C59", margin: "6px 0 0", maxWidth: 320, lineHeight: 1.5 }}>
          Logo PNG 660×660 (1:1) — Google lo recorta en círculo, dejá 15% de margen. La hero se genera
          por tarjeta (tu imagen + progreso encima), base PNG 1032×812. Sin texto debajo: el progreso vive en la imagen.
        </p>
      </div>

      {/* ——— Apple Wallet · Store Card ——— */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#9A9A96", margin: "0 0 6px" }}>
          APPLE WALLET · Store Card <span style={{ fontWeight: 400 }}>(requiere Apple Developer)</span>
        </p>
        <div style={{ background: bg, color: fg, borderRadius: 16, maxWidth: 320, overflow: "hidden" }}>
          {/* Barra superior real: logo chico a la izquierda, SIN círculo ni números */}
          <div className="flex items-center" style={{ padding: "12px 14px 8px" }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logoUrl}
                  alt="logo"
                  style={{ height: 25, width: "auto", maxWidth: 120, objectFit: "contain", display: "block" }}
                />
              ) : null}
              <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {issuer}
              </span>
            </div>
          </div>

          {/* Strip: la misma imagen generada, recorte central al formato banner */}
          <div style={{ height: 128, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)" }}>
              <GeneratedHero
                title={title}
                balance={balance}
                goal={p.goal}
                cardType={p.cardType}
                reward={p.rewardDescription}
                rewards={0}
                bg={bg}
                fg={p.heroImageUrl ? "#FFFFFF" : fg}
                accent={accent}
                heroImageUrl={p.heroImageUrl}
                stampImageUrl={p.stampImageUrl}
              />
            </div>
          </div>

          <div style={{ padding: "10px 14px 14px" }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#1F1F1F", fontWeight: 700 }}>QR · PassKit barcode</div>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#5C5C59", margin: "6px 0 0", maxWidth: 320, lineHeight: 1.5 }}>
          Logo hasta 480×150 px (@3x) — arriba a la izquierda, sin recorte. Strip 1125×432 — tu hero generada con progreso (recorte central).
        </p>
      </div>

      {/* Qué se ignora en wallets */}
      <div
        style={{
          border: "1px dashed #3D3D3B",
          borderRadius: 10,
          padding: 12,
          fontSize: 12,
          color: "#9A9A96",
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        ⚠️ En wallets se ignoran: color de texto, color de acento, tipografía y
        plantilla (moderno/clásico/cristal/futurista). Solo llegan: logo, hero generada
        con tu progreso, color de fondo, título y QR.
      </div>
    </div>
  );
}
