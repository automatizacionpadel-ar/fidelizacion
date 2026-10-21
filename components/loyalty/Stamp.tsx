import type { CSSProperties } from "react";

// Un sello: el icono o imagen del negocio, sin círculos.
// Ganado = pleno color · faltante = fantasma (apagado).
export function Stamp({
  earned,
  icon,
  imageUrl,
  size = 32,
  isNew = false,
  accentColor = "#7AB619",
}: {
  earned: boolean;
  icon: string;
  imageUrl?: string | null;
  size?: number;
  isNew?: boolean;
  accentColor?: string;
}) {
  const style = { "--stamp-accent": accentColor } as CSSProperties;
  const className = isNew ? "stamp-new-wrap" : undefined;

  if (imageUrl) {
    return (
      <span className={className} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={earned ? "Sello sumado" : "Sello pendiente"}
          title={earned ? "Sello sumado" : "Te falta"}
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            filter: earned ? "none" : "grayscale(1)",
            opacity: earned ? 1 : 0.3,
            display: "block",
          }}
        />
      </span>
    );
  }
  return (
    <span
      className={className}
      style={{ ...style, fontSize: size * 0.85, lineHeight: 1, opacity: earned ? 1 : 0.25, filter: earned ? "none" : "grayscale(1)" }}
      title={earned ? "Sello sumado" : "Te falta"}
    >
      {icon}
    </span>
  );
}
