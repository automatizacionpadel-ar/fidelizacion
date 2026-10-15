// Vista previa de la PÁGINA DE CAPTACIÓN (/f/[slug]).
// Es una página web móvil (se abre al escanear el QR del mostrador),
// NO es la tarjeta wallet. Diseño libre: colores, tipografía y logo
// sí se aplican aquí tal cual.
import { cardFontStack } from "@/lib/loyalty/cardDesign";

export type CapturePreviewProps = {
  businessName?: string;
  cardTitle: string;
  cardType: "stamps" | "points";
  goal: number;
  rewardDescription: string;
  terms?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl?: string | null;
  fontFamily?: string;
};

// Misma estructura que app/f/[slug]/page.tsx pero en miniatura,
// con CTA sticky como en el celular real.
export function CapturePreview(p: CapturePreviewProps) {
  const unit = p.cardType === "stamps" ? "sellos" : "puntos";
  return (
    <div
      style={{
        background: p.backgroundColor,
        color: p.textColor,
        fontFamily: cardFontStack(p.fontFamily),
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "20px 18px 90px" }}>
        {/* Logo primero, en su propia línea */}
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
                width: "80%",
                aspectRatio: "16/9",
                borderRadius: 18,
                background: p.accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 56,
                color: "#20201F",
                margin: "0 auto",
              }}
            >
              {(p.cardTitle || "F")[0]}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.2, textAlign: "center" }}>
            {p.cardTitle || "Tu tarjeta"}
          </h1>
        </div>

        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          🎁 Premio: <strong>{p.rewardDescription || "—"}</strong>
          <br />
          <span style={{ opacity: 0.8 }}>
            Meta: {p.goal} {unit}
          </span>
        </div>

        {/* Mock del formulario de registro */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 12,
            padding: 16,
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>
            Celular (WhatsApp)
          </p>
          <div
            style={{
              borderRadius: 10,
              border: "1px solid #3D3D3B",
              background: "#20201F",
              padding: "10px 12px",
              fontSize: 14,
              opacity: 0.6,
            }}
          >
            Ej. 11 5555 5555
          </div>
          <p style={{ fontSize: 11, opacity: 0.6, margin: "10px 0 0" }}>
            Al registrarte aceptás el uso de tus datos para tu tarjeta.
          </p>
        </div>

        {p.terms ? (
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>{p.terms}</p>
        ) : null}
      </div>

      {/* CTA sticky como en el móvil real */}
      <div
        style={{
          marginTop: "auto",
          position: "sticky",
          bottom: 0,
          padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))",
          background: `linear-gradient(transparent, ${p.backgroundColor} 40%)`,
        }}
      >
        <div
          style={{
            background: p.accentColor,
            color: "#20201F",
            fontWeight: 800,
            borderRadius: 12,
            padding: "14px 16px",
            textAlign: "center",
            fontSize: 16,
          }}
        >
          Continuar
        </div>
      </div>
    </div>
  );
}
