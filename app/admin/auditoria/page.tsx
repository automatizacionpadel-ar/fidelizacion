import { requireSuperAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "client.create": "Cliente creado",
  "client.update": "Cliente actualizado",
  "client.suspend": "Cliente suspendido",
  "client.resume": "Cliente reactivado",
  "client.delete": "Cliente eliminado",
  "payment.mark_paid": "Pago confirmado y cliente activado",
  "ally.create": "Aliado creado",
  "ally.update": "Aliado actualizado",
  "ally.suspend": "Aliado suspendido",
  "ally.resume": "Aliado reactivado",
  "ally.delete": "Aliado eliminado",
  "role.grant": "Rol asignado",
  "role.revoke": "Rol revocado",
  "settings.bank_update": "Datos bancarios actualizados",
};

export default async function AuditPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const actorIds = [...new Set((data ?? []).map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const actors = await Promise.all(
    actorIds.map(async (id) => {
      const { data: user } = await admin.auth.admin.getUserById(id);
      return [id, user.user?.email ?? id] as const;
    })
  );
  const emails = new Map(actors);

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Auditoría</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Últimas 100 acciones administrativas.
      </p>

      {error ? (
        <Card style={{ marginTop: 16 }}>
          <p style={{ color: "#f87171", fontSize: 14 }}>{error.message}</p>
          <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6 }}>
            ¿Aplicaste la migración 017?
          </p>
        </Card>
      ) : (
        <div style={{ marginTop: 16 }}>
          <Table
            head={["Fecha", "Acción", "Entidad", "Actor", "Detalle"]}
            rows={(data ?? []).map((r) => [
              new Date(r.created_at).toLocaleString("es-AR"),
              ACTION_LABELS[r.action] ?? r.action,
              `${r.entity_type}${r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}…` : ""}`,
              r.actor_user_id ? emails.get(r.actor_user_id) ?? r.actor_user_id : "Sistema",
              <code key="m" style={{ fontSize: 11, color: "#9A9A96", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(r.metadata)}
              </code>,
            ])}
          />
        </div>
      )}
    </div>
  );
}
