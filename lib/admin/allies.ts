import { createAdminClient } from "@/lib/supabase/admin";
import { planPrice } from "@/lib/billing";
import { listAdminClients, ADMIN_PAGE_SIZE } from "@/lib/admin/clients";
import type { AdminAllyDetail, AdminAllyRow, AdminListResult } from "@/lib/admin/types";
import type { AllyRecord } from "@/lib/auth/roles";

function withStats(
  ally: AllyRecord,
  businesses: { ally_id: string | null; plan: string; status: string }[]
): AdminAllyRow {
  const mine = businesses.filter((b) => b.ally_id === ally.id);
  const active = mine.filter((b) => b.status === "active");
  const mrr = active.reduce((sum, b) => sum + planPrice(b.plan), 0);
  return {
    ...ally,
    clients_count: mine.length,
    active_clients: active.length,
    estimated_commission: Math.round((mrr * Number(ally.commission_rate)) / 100),
  };
}

export async function listAdminAllies({
  q,
  status,
  page = 1,
}: {
  q?: string;
  status?: string;
  page?: number;
}): Promise<AdminListResult<AdminAllyRow>> {
  const admin = createAdminClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin.from("allies").select("*", { count: "exact" });
  if (q) {
    const term = q.replace(/[%,()]/g, "").trim();
    if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,contact_name.ilike.%${term}%`);
  }
  if (status === "active" || status === "suspended") query = query.eq("status", status);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((a) => a.id);
  const { data: businesses } = ids.length
    ? await admin.from("businesses").select("ally_id,plan,status").in("ally_id", ids)
    : { data: [] as { ally_id: string | null; plan: string; status: string }[] };

  return {
    rows: (data ?? []).map((a) => withStats(a as AllyRecord, businesses ?? [])),
    total: count ?? 0,
    page: safePage,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

export async function getAdminAllyDetail(id: string): Promise<AdminAllyDetail | null> {
  const admin = createAdminClient();
  const { data: ally, error } = await admin.from("allies").select("*").eq("id", id).maybeSingle();
  if (error || !ally) return null;

  const { data: businesses } = await admin
    .from("businesses")
    .select("ally_id,plan,status")
    .eq("ally_id", id);
  const clients = await listAdminClients({ allyId: id, page: 1 });

  return {
    ...withStats(ally as AllyRecord, businesses ?? []),
    clients: clients.rows,
  };
}

export async function getAlliesOptions() {
  const admin = createAdminClient();
  const { data } = await admin.from("allies").select("id,name,status").order("name");
  return (data ?? []) as { id: string; name: string; status: string }[];
}
