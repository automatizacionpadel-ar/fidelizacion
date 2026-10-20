import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type PlatformRole = "super_admin" | "ally" | "client";

export type AllyRecord = {
  id: string;
  user_id: string | null;
  name: string;
  legal_name: string;
  tax_id: string;
  contact_name: string;
  email: string;
  phone: string;
  commission_rate: number;
  status: "active" | "suspended";
  notes: string;
  created_at: string;
  updated_at: string;
};

export type SessionProfile = {
  role: PlatformRole;
  ally: AllyRecord | null;
  hasBusiness: boolean;
};

// Resuelve el rol sin redirigir. Si las migraciones nuevas todavía no están
// aplicadas, degrada a cliente para que la app existente siga funcionando.
export async function resolveProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<SessionProfile> {
  const [{ data: roleRow }, { data: ally }, { data: business }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle(),
    supabase.from("allies").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (roleRow?.role === "super_admin") {
    return { role: "super_admin", ally: null, hasBusiness: !!business };
  }
  if (ally) {
    return { role: "ally", ally: ally as AllyRecord, hasBusiness: !!business };
  }
  return { role: "client", ally: null, hasBusiness: !!business };
}

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const profile = await resolveProfile(supabase, user.id);
  return { supabase, user, profile };
}

export async function getSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!data) return null;
  return { supabase, user };
}

// Para páginas: redirige en lugar de devolver null.
export async function requireSuperAdmin() {
  const session = await getSuperAdmin();
  if (!session) redirect("/panel");
  return session;
}

// Para Route Handlers: el caller decide el status HTTP.
export async function getSuperAdminApi(): Promise<
  { supabase: SupabaseClient; user: User } | null
> {
  const session = await getSuperAdmin();
  if (!session) return null;
  return session as { supabase: SupabaseClient; user: User };
}

async function hasSuperAdminRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return !!data;
}

export async function getAlly() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (await hasSuperAdminRole(supabase, user.id)) return null;
  const { data: ally } = await supabase
    .from("allies")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ally) return null;
  return { supabase, user, ally: ally as AllyRecord };
}

export async function requireAlly() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (await hasSuperAdminRole(supabase, user.id)) redirect("/admin");
  const { data: ally } = await supabase
    .from("allies")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ally) redirect("/panel");
  if ((ally as AllyRecord).status === "suspended") redirect("/cuenta-suspendida");
  return { supabase, user, ally: ally as AllyRecord };
}
