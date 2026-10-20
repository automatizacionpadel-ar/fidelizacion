import { requireAlly } from "@/lib/auth/roles";
import { Card } from "@/components/ui/Card";
import { AllyProfileForm } from "@/components/ally/AllyProfileForm";
import { AllyPasswordForm } from "@/components/ally/AllyPasswordForm";

export const dynamic = "force-dynamic";

export default async function AllyProfilePage() {
  const { ally, user } = await requireAlly();

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mi perfil</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Actualizá tus datos de contacto comercial.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]" style={{ marginTop: 16 }}>
        <div className="flex flex-col gap-4">
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Datos de contacto</h2>
            <AllyProfileForm ally={ally} />
          </Card>

          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Cambiar contraseña</h2>
            <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
              Si estás usando una contraseña temporal, cambiala por una propia.
            </p>
            <AllyPasswordForm email={user.email ?? ""} />
          </Card>
        </div>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Datos de la cuenta</h2>
          <dl style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8 }}>
            <dt style={{ color: "#9A9A96", fontSize: 12 }}>Nombre comercial</dt>
            <dd>{ally.name}</dd>
            <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Email de acceso</dt>
            <dd>{user.email ?? ally.email}</dd>
            <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Comisión</dt>
            <dd>{Number(ally.commission_rate)}%</dd>
            <dt style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>Estado</dt>
            <dd>{ally.status === "active" ? "Activo" : "Suspendido"}</dd>
          </dl>
          <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            Para cambiar el nombre comercial, el email de acceso o la comisión,
            contactá al administrador de la plataforma.
          </p>
        </Card>
      </div>
    </div>
  );
}
