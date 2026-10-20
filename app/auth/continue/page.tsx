import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function ContinuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await resolveProfile(supabase, user.id);
  if (profile.role === "super_admin") redirect("/admin");
  if (profile.role === "ally") {
    if (profile.ally?.status === "suspended") redirect("/cuenta-suspendida");
    redirect("/aliado");
  }
  redirect("/panel");
}
