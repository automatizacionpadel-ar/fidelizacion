import { requireSuperAdmin } from "@/lib/auth/roles";
import { getAlliesOptions } from "@/lib/admin/allies";
import { Card } from "@/components/ui/Card";
import { ClientCreateForm } from "@/components/admin/ClientForm";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  await requireSuperAdmin();
  const allies = await getAlliesOptions();

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Nuevo cliente</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Crea el negocio y la cuenta de acceso de su dueño.
      </p>
      <Card style={{ marginTop: 16 }}>
        <ClientCreateForm allies={allies} />
      </Card>
    </div>
  );
}
