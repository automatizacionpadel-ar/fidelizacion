import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminBusinessDetail, AdminBusinessRow, AdminListResult, AdminPayment } from "@/lib/admin/types";
import { createReceiptSignedUrl } from "@/lib/admin/storage";

export const ADMIN_PAGE_SIZE = 25;

type OwnerInfo = { email: string | null; name: string | null; phone: string | null };

async function ownerInfo(userId: string): Promise<OwnerInfo> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return {
      email: data.user?.email ?? null,
      name: (data.user?.user_metadata?.nombre as string | undefined) ?? null,
      phone: (data.user?.user_metadata?.telefono as string | undefined) ?? null,
    };
  } catch {
    return { email: null, name: null, phone: null };
  }
}

export async function listAdminClients({
  q,
  status,
  plan,
  allyId,
  page = 1,
}: {
  q?: string;
  status?: string;
  plan?: string;
  allyId?: string;
  page?: number;
}): Promise<AdminListResult<AdminBusinessRow>> {
  const admin = createAdminClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = admin.from("businesses").select("*", { count: "exact" });
  if (q) {
    const term = q.replace(/[%,()]/g, "").trim();
    if (term) query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (status === "active" || status === "suspended") query = query.eq("status", status);
  if (plan === "base" || plan === "pro") query = query.eq("plan", plan);
  if (allyId === "none") query = query.is("ally_id", null);
  else if (allyId) query = query.eq("ally_id", allyId);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);

  const [{ data: allies }, owners] = await Promise.all([
    admin.from("allies").select("id,name"),
    Promise.all((data ?? []).map((b) => ownerInfo(b.owner_user_id))),
  ]);
  const allyNames = new Map((allies ?? []).map((a) => [a.id, a.name]));

  const rows: AdminBusinessRow[] = (data ?? []).map((b, i) => ({
    ...(b as AdminBusinessRow),
    owner_email: owners[i].email,
    owner_name: owners[i].name,
    owner_phone: owners[i].phone,
    ally_name: b.ally_id ? allyNames.get(b.ally_id) ?? null : null,
  }));

  return { rows, total: count ?? 0, page: safePage, pageSize: ADMIN_PAGE_SIZE };
}

export async function getAdminClientDetail(id: string): Promise<AdminBusinessDetail | null> {
  const admin = createAdminClient();
  const { data: business, error } = await admin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !business) return null;

  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ count: members }, { count: cards }, { count: transactions }, { count: activeCards }, { data: ally }, owner, { data: paymentRows }] =
    await Promise.all([
      admin.from("loyalty_members").select("id", { count: "exact", head: true }).eq("business_id", id),
      admin.from("loyalty_cards").select("id", { count: "exact", head: true }).eq("business_id", id),
      admin.from("loyalty_transactions").select("id", { count: "exact", head: true }).eq("business_id", id),
      admin
        .from("loyalty_cards")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id)
        .gte("last_earn_at", monthAgo),
      business.ally_id
        ? admin.from("allies").select("name").eq("id", business.ally_id).maybeSingle()
        : Promise.resolve({ data: null }),
      ownerInfo(business.owner_user_id),
      admin
        .from("service_payments")
        .select("*")
        .eq("business_id", id)
        .order("period", { ascending: false })
        .limit(24),
    ]);

  const payments: AdminPayment[] = await Promise.all(
    ((paymentRows ?? []) as Omit<AdminPayment, "receipt_url">[]).map(async (payment) => ({
      ...payment,
      receipt_url: payment.receipt_path ? await createReceiptSignedUrl(payment.receipt_path) : null,
    }))
  );

  return {
    ...(business as AdminBusinessDetail),
    members: members ?? 0,
    cards: cards ?? 0,
    transactions: transactions ?? 0,
    active_cards_30d: activeCards ?? 0,
    ally_name: (ally as { name?: string } | null)?.name ?? null,
    owner_email: owner.email,
    owner_name: owner.name,
    owner_phone: owner.phone,
    payments,
  };
}

export async function listAllyOptions() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("allies")
    .select("id,name,status")
    .order("name", { ascending: true });
  return (data ?? []) as { id: string; name: string; status: string }[];
}
