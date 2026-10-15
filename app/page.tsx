import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <div style={{ background: "#20201F", minHeight: "100vh" }}>
      <div className="w-[90%] mx-auto" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "#7AB619",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#20201F",
              }}
            >
              F
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#F0F0EE" }}>
              Fidelización
            </span>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button>Crear mi tarjeta</Button>
            </Link>
          </div>
        </header>

        <main
          className="grid gap-6 md:grid-cols-2"
          style={{ marginTop: 48, alignItems: "center" }}
        >
          <div>
            <h1
              style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 800, color: "#F0F0EE" }}
            >
              Tu tarjeta de sellos digital, sin apps raras.
            </h1>
            <p style={{ color: "#9A9A96", fontSize: 17, marginTop: 16 }}>
              Creá tu tarjeta en minutos, pegá el QR en tu local y sumá sellos o
              puntos con el celu. Tus clientes la guardan en Google Wallet o la
              usan desde la web.
            </p>
            <div className="flex gap-2" style={{ marginTop: 24 }}>
              <Link href="/registro">
                <Button>Empezar gratis</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Ya tengo cuenta</Button>
              </Link>
            </div>
          </div>

          <Card>
            <p style={{ color: "#5C5C59", fontSize: 12, fontWeight: 700 }}>
              VISTA PREVIA
            </p>
            <div
              style={{
                marginTop: 12,
                background: "#20201F",
                border: "1px solid #3D3D3B",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div className="flex items-center justify-between">
                <strong style={{ color: "#F0F0EE" }}>Café de barrio ☕</strong>
                <span
                  style={{
                    background: "#7AB619",
                    color: "#20201F",
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  7 de 10
                </span>
              </div>
              <div className="flex gap-2" style={{ marginTop: 14 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: i < 7 ? "#7AB619" : "transparent",
                      border: "1px solid #7AB619",
                    }}
                  />
                ))}
              </div>
              <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 12 }}>
                Premio: un café gratis
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
