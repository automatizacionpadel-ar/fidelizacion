import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAction =
  | "client.create"
  | "client.update"
  | "client.suspend"
  | "client.resume"
  | "client.delete"
  | "payment.mark_paid"
  | "ally.create"
  | "ally.update"
  | "ally.suspend"
  | "ally.resume"
  | "ally.delete"
  | "role.grant"
  | "role.revoke"
  | "settings.bank_update";

export async function logAdminAction({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata = {},
}: {
  actorUserId: string;
  action: AdminAction;
  entityType: "business" | "ally" | "user_role" | "settings";
  entityId: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (error) {
    // La acción principal no debe fallar porque falle la auditoría.
    console.error("[admin-audit]", (error as Error).message);
  }
}
