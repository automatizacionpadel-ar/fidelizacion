import { Card } from "@/components/ui/Card";

export function AccountSuspended({ businessName }: { businessName?: string | null }) {
  return (
    <div style={{ background: "#20201F", minHeight: "100dvh", color: "#F0F0EE" }}>
      <div className="w-[92%] mx-auto" style={{ maxWidth: 480, paddingTop: 48, paddingBottom: 48 }}>
        <Card>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#f87171" }}>
            SERVICIO PAUSADO
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
            {businessName ? `${businessName} está pausado` : "Este programa está pausado"}
          </h1>
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>
            La cuenta del negocio está suspendida temporalmente. No se pueden sumar
            sellos ni canjear premios por ahora.
          </p>
        </Card>
      </div>
    </div>
  );
}
