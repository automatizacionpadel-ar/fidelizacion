import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_IDS, planPrice } from "@/lib/billing";

export type ActivityPoint = { date: string; count: number };

export type TopClient = {
  id: string;
  name: string;
  slug: string;
  transactions: number;
  cards?: number;
  status?: string;
  plan?: string;
};

export type TopAlly = {
  id: string;
  name: string;
  commission_rate: number;
  active_clients: number;
  clients: number;
  active_by_plan?: Record<string, number>;
};

export type AdminKpis = {
  period: string;
  generated_at: string;
  clients_total: number;
  clients_active: number;
  clients_suspended: number;
  clients_new_30d: number;
  clients_without_ally: number;
  allies_total: number;
  allies_active: number;
  allies_suspended: number;
  members_total: number;
  new_members_30d: number;
  cards_total: number;
  active_cards_30d: number;
  programs_active: number;
  paid_current: number;
  pending_current: number;
  clients_by_plan: Record<string, number>;
  active_by_plan: Record<string, number>;
  paid_by_plan: Record<string, number>;
  transactions_30d: number;
  earn_30d: number;
  redeem_30d: number;
  adjust_30d: number;
  activity_30d: ActivityPoint[];
  top_clients: TopClient[];
  top_allies: TopAlly[];
};

export type AllyKpis = {
  period: string;
  generated_at: string;
  ally_id: string;
  ally_name: string;
  commission_rate: number;
  clients_total: number;
  clients_active: number;
  clients_suspended: number;
  members_total: number;
  new_members_30d: number;
  cards_total: number;
  active_cards_30d: number;
  paid_current: number;
  pending_current: number;
  clients_by_plan: Record<string, number>;
  active_by_plan: Record<string, number>;
  transactions_30d: number;
  earn_30d: number;
  redeem_30d: number;
  activity_30d: ActivityPoint[];
  top_clients: TopClient[];
};

export function mrrFromPlans(byPlan: Record<string, number> | null | undefined): number {
  if (!byPlan) return 0;
  return PLAN_IDS.reduce((sum, plan) => sum + (Number(byPlan[plan]) || 0) * planPrice(plan), 0);
}

export function commissionFromPlans(
  byPlan: Record<string, number> | null | undefined,
  rate: number
): number {
  return Math.round((mrrFromPlans(byPlan) * Number(rate || 0)) / 100);
}

export function collectionRate(paid: number, pending: number): number {
  const total = Number(paid) + Number(pending);
  if (total <= 0) return 0;
  return Math.round((Number(paid) / total) * 100);
}

export async function getAdminKpis(
  supabase: SupabaseClient,
  period: string
): Promise<AdminKpis | null> {
  const { data, error } = await supabase.rpc("admin_dashboard_kpis", { p_period: period });
  if (error || !data) {
    console.error("[admin-kpis]", error?.message);
    return null;
  }
  return data as AdminKpis;
}

export async function getAllyKpis(
  supabase: SupabaseClient,
  allyId: string,
  period: string
): Promise<AllyKpis | null> {
  const { data, error } = await supabase.rpc("ally_dashboard_kpis", {
    p_allies_id: allyId,
    p_period: period,
  });
  if (error || !data) {
    console.error("[ally-kpis]", error?.message);
    return null;
  }
  return data as AllyKpis;
}
