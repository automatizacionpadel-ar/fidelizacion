import { requireSuperAdmin } from "@/lib/auth/roles";
import { Card } from "@/components/ui/Card";
import { AllyCreateForm } from "@/components/admin/AllyForm";

export const dynamic = "force-dynamic";

export default async function NewAllyPage() {
  await requireSuperAdmin();

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Nuevo aliado</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Crea el partner comercial y su cuenta de acceso al portal.
      </p>
      <Card style={{ marginTop: 16 }}>
        <AllyCreateForm />
      </Card>
    </div>
  );
}
