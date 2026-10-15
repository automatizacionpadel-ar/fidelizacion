export const dynamic = "force-dynamic";

import { Scanner } from "@/components/loyalty/Scanner";

export default function EscanearPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Escanear / Sumar</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 16 }}>Apuntá al QR del cliente o buscalo por teléfono.</p>
      <Scanner />
    </div>
  );
}
