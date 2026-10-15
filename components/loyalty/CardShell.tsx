import type { CSSProperties, ReactNode } from "react";
import { cardFontStack, normalizeTemplate } from "@/lib/loyalty/cardDesign";

// Barra de progreso para tarjetas de Puntos (en vez de la grilla de sellos).
export function CardProgress({ balance, goal, accentColor }: { balance: number; goal: number; accentColor: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: 12, borderRadius: 999, background: "rgba(128,128,128,0.35)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: accentColor }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>{pct}%</span>
    </div>
  );
}

type ShellProps = {
  template?: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily?: string | null;
  radius?: number;
  padding?: number;
  shadow?: string;
  children: ReactNode;
};

// Contenedor visual compartido por la vista previa (panel) y la tarjeta
// virtual del cliente. Cada plantilla cambia fondo, marcos y decoraciones;
// el contenido (logo, sellos, premio) lo pone cada componente.
export function CardShell({
  template,
  backgroundColor,
  textColor,
  accentColor,
  fontFamily,
  radius = 14,
  padding = 18,
  shadow,
  children,
}: ShellProps) {
  const t = normalizeTemplate(template);

  const contentStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    color: textColor,
    fontFamily: cardFontStack(fontFamily),
    borderRadius: radius,
    padding,
  };

  if (t === "clasico") {
    // Marco dorado doble: borde degradado + línea interior fina.
    return (
      <div
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}66 45%, ${accentColor} 70%, ${accentColor}99)`,
          borderRadius: radius + 3,
          padding: 2,
          boxShadow: shadow ?? "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            background: backgroundColor,
            borderRadius: radius + 1,
            padding: 2,
          }}
        >
          <div
            style={{
              ...contentStyle,
              background: backgroundColor,
              border: `1px solid ${accentColor}55`,
            }}
          >
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                borderRadius: 2,
                marginBottom: 12,
              }}
            />
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (t === "glass") {
    // Glassmorphism: fondo con degradado + manchas de color difuminadas
    // y panel translúcido con blur encima.
    return (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: radius,
          background: `linear-gradient(135deg, ${accentColor}44, ${backgroundColor} 55%, #7c3aed33)`,
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: shadow ?? "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            right: -50,
            top: -60,
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.35,
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            left: -50,
            bottom: -60,
            borderRadius: "50%",
            background: "#7c3aed",
            opacity: 0.3,
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            ...contentStyle,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.22)",
            margin: 10,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (t === "futurista") {
    // Neón: borde y resplandor del color de acento + barra diagonal.
    return (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: radius,
          background: backgroundColor,
          color: textColor,
          fontFamily: cardFontStack(fontFamily),
          border: `1px solid ${accentColor}`,
          boxShadow: `0 0 22px ${accentColor}55, inset 0 0 28px ${accentColor}14, ${shadow ?? "0 8px 32px rgba(0,0,0,0.45)"}`,
          padding,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 140,
            height: 60,
            background: `linear-gradient(90deg, transparent, ${accentColor}66)`,
            transform: "rotate(25deg)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, color: "inherit", fontFamily: "inherit" }}>
          {children}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
      </div>
    );
  }

  // Moderno: limpio, sólido, con barra superior de acento.
  return (
    <div
      style={{
        background: backgroundColor,
        color: textColor,
        fontFamily: cardFontStack(fontFamily),
        border: "1px solid #3D3D3B",
        borderRadius: radius,
        padding,
        boxShadow: shadow,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 4,
          margin: `-${padding}px -${padding}px 12px`,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)`,
        }}
      />
      {children}
    </div>
  );
}
