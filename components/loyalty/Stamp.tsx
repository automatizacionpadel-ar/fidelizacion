// Un sello: el icono o imagen del negocio, sin círculos.
// Ganado = pleno color · faltante = fantasma (apagado).
export function Stamp({
  earned,
  icon,
  imageUrl,
  size = 32,
}: {
  earned: boolean;
  icon: string;
  imageUrl?: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
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
        }}
      />
    );
  }
  return (
    <span
      title={earned ? "Sello sumado" : "Te falta"}
      style={{
        fontSize: size * 0.85,
        lineHeight: 1,
        opacity: earned ? 1 : 0.25,
        filter: earned ? "none" : "grayscale(1)",
      }}
    >
      {icon}
    </span>
  );
}
