import { requireSuperAdmin } from "@/lib/auth/roles";
import { getAdminBankSettings } from "@/lib/admin/settings";
import { Card } from "@/components/ui/Card";
import { BankSettingsForm } from "@/components/admin/BankSettingsForm";

export const dynamic = "force-dynamic";

export default async function BankSettingsPage() {
  await requireSuperAdmin();
  const { settings, error } = await getAdminBankSettings();

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Configuración bancaria</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Estos datos se muestran a los clientes en <strong style={{ color: "#F0F0EE" }}>/panel/pagos</strong> para que puedan transferir.
      </p>

      {error ? (
        <Card style={{ marginTop: 16, borderColor: "#f87171" }}>
          <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
        </Card>
      ) : null}

      <Card style={{ marginTop: 16 }}>
        <BankSettingsForm settings={settings} />
      </Card>
    </div>
  );
}
