import type { AllyRecord } from "@/lib/auth/roles";

export type AdminBusinessRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "active" | "suspended";
  ally_id: string | null;
  notes: string;
  owner_user_id: string;
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  ally_name: string | null;
};

export type AdminBusinessDetail = AdminBusinessRow & {
  members: number;
  cards: number;
  transactions: number;
  active_cards_30d: number;
};

export type AdminAllyRow = AllyRecord & {
  clients_count: number;
  active_clients: number;
  estimated_commission: number;
};

export type AdminAllyDetail = AdminAllyRow & {
  clients: AdminBusinessRow[];
};

export type AdminListResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};
