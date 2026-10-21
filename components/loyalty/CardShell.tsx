import type { CSSProperties, ReactNode } from "react";
import { cardFontStack, normalizeTemplate } from "@/lib/loyalty/cardDesign";

// Barra de progreso para tarjetas de Puntos (en vez de la grilla de sellos).
export function CardProgress({
  balance,
  goal,
  accentColor,
  animate = false,
  fromBalance,
}: {
  balance: number;
  goal: number;
  accentColor: string;
  animate?: boolean;
  fromBalance?: number;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
  const fromPct = goal > 0 ? Math.max(0, Math.min(100, ((fromBalance ?? 0) / goal) * 100)) : 0;

  return (
    <div className="card-progress">
      <div className="card-progress-track">
        <div
          className={`card-progress-fill${animate ? " is-animated" : ""}`}
          style={
            {
              width: `${pct}%`,
              color: accentColor,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
              "--from-scale": fromPct / 100,
            } as CSSProperties
          }
        />
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
  const font = cardFontStack(fontFamily);
  const baseShadow = shadow ?? "0 24px 60px rgba(0,0,0,0.45)";

  const contentStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    color: textColor,
    fontFamily: font,
    padding,
  };

  const corners = ["tl", "tr", "bl", "br"] as const;

  if (t === "clasico") {
    return (
      <div
        className="card-shell card-shell-clasico"
        style={{
          borderRadius: radius + 5,
          padding: 2,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}55 28%, ${accentColor} 52%, ${accentColor}44 76%, ${accentColor})`,
          boxShadow: `${baseShadow}, 0 0 0 1px ${accentColor}33, inset 0 0 30px ${accentColor}18`,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius + 3,
            padding: 2,
            background: backgroundColor,
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: radius + 1,
              background: `radial-gradient(120% 90% at 50% -20%, ${accentColor}24, transparent 55%), linear-gradient(165deg, ${backgroundColor}, ${backgroundColor} 60%, ${accentColor}0d)`,
              border: `1px solid ${accentColor}55`,
              color: textColor,
              fontFamily: font,
            }}
          >
            <div className="card-orb card-orb-a" style={{ width: 190, height: 190, top: -90, right: -70, background: accentColor, opacity: 0.16 }} />
            <div className="card-sheen" style={{ animationDuration: "9s" }} />
            {corners.map((c) => (
              <span key={c} className={`card-corner card-corner-${c}`} style={{ borderColor: accentColor }} />
            ))}
            <div style={{ ...contentStyle, padding }}>
              <div
                style={{
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  borderRadius: 2,
                  marginBottom: 16,
                  boxShadow: `0 0 14px ${accentColor}66`,
                }}
              />
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (t === "glass") {
    return (
      <div
        className="card-shell card-shell-glass"
        style={{
          borderRadius: radius + 2,
          background: `linear-gradient(145deg, ${accentColor}55, ${backgroundColor} 48%, #7c3aed33)`,
          border: "1px solid rgba(255,255,255,0.26)",
          boxShadow: `${baseShadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
          color: textColor,
          fontFamily: font,
        }}
      >
        <div className="card-orb card-orb-a" style={{ width: 220, height: 220, right: -80, top: -90, background: accentColor, opacity: 0.5, filter: "blur(48px)" }} />
        <div className="card-orb card-orb-b" style={{ width: 180, height: 180, left: -70, bottom: -80, background: "#7c3aed", opacity: 0.35, filter: "blur(46px)" }} />
        <div className="card-grid" style={{ opacity: 0.18 }} />
        <div
          className="card-glass-panel"
          style={{
            ...contentStyle,
            margin: 10,
            borderRadius: radius,
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {children}
        </div>
        <div className="card-sheen" style={{ animationDuration: "11s" }} />
      </div>
    );
  }

  if (t === "futurista") {
    return (
      <div
        className="card-shell card-shell-futurista"
        style={{
          borderRadius: radius + 2,
          background: backgroundColor,
          color: textColor,
          fontFamily: font,
          border: `1px solid ${accentColor}bb`,
          boxShadow: `0 0 0 1px ${accentColor}22, 0 0 30px ${accentColor}44, inset 0 0 40px ${accentColor}10, ${baseShadow}`,
        }}
      >
        <div
          className="card-grid"
          style={{
            backgroundImage: `linear-gradient(${accentColor}22 1px, transparent 1px), linear-gradient(90deg, ${accentColor}22 1px, transparent 1px)`,
            opacity: 0.5,
          }}
        />
        <div className="card-scanlines" />
        <div
          className="card-orb card-orb-a"
          style={{ width: 210, height: 100, top: -50, right: -45, background: accentColor, opacity: 0.35, filter: "blur(36px)", transform: "rotate(-22deg)" }}
        />
        <div
          style={{
            position: "absolute",
            top: -32,
            right: -30,
            width: 150,
            height: 58,
            background: `linear-gradient(90deg, transparent, ${accentColor}77)`,
            transform: "rotate(25deg)",
          }}
        />
        {corners.map((c) => (
          <span key={c} className={`card-hud-corner card-hud-corner-${c}`} style={{ borderColor: accentColor }} />
        ))}
        <div style={contentStyle}>{children}</div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 16px ${accentColor}`,
          }}
        />
      </div>
    );
  }

  // Moderno: gradiente profundo, luz ambiental y brillo que recorre la tarjeta.
  return (
    <div
      className="card-shell card-shell-modern"
      style={{
        borderRadius: radius + 2,
        padding: 1,
        background: `linear-gradient(155deg, ${accentColor}bb, ${accentColor}22 32%, rgba(255,255,255,0.1) 58%, ${accentColor}55)`,
        boxShadow: `${baseShadow}, 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: radius,
          background: `linear-gradient(155deg, ${backgroundColor} 0%, ${backgroundColor} 52%, ${accentColor}18 100%)`,
          color: textColor,
          fontFamily: font,
        }}
      >
        <div className="card-orb card-orb-a" style={{ width: 190, height: 190, top: -95, right: -55, background: accentColor, opacity: 0.28 }} />
        <div className="card-orb card-orb-b" style={{ width: 150, height: 150, bottom: -85, left: -60, background: accentColor, opacity: 0.14 }} />
        <div className="card-grid" style={{ opacity: 0.08 }} />
        <div className="card-sheen" />
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  );
}
