import Link from "next/link";

export function SuspensionBanner({ reason }: { reason?: string | null }) {
  return (
    <div
      role="status"
      style={{
        background: "#3A2424",
        border: "1px solid #f87171",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 800, color: "#f87171" }}>
        Cuenta suspendida — modo lectura
      </p>
      <p style={{ fontSize: 13, color: "#F0F0EE", marginTop: 4, lineHeight: 1.5 }}>
        No se pueden sumar sellos, canjear premios, editar tarjetas ni enviar avisos.
        Podés consultar tus datos y regularizar tus pagos.{" "}
        <Link href="/panel/pagos" style={{ color: "#7AB619", fontWeight: 700, textDecoration: "underline" }}>
          Ir a pagos
        </Link>
        {reason ? <span style={{ color: "#9A9A96" }}> Motivo: {reason}</span> : null}
      </p>
    </div>
  );
}
