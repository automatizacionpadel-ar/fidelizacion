import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/auth/roles";
import { Sidebar } from "@/components/panel/Sidebar";
import { MobileNav } from "@/components/panel/MobileNav";
import { SuspensionBanner } from "@/components/panel/SuspensionBanner";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
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

  const { data: business } = await supabase
    .from("businesses")
    .select("status,suspended_reason")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh", color: "#F0F0EE", display: "flex" }}>
      <Sidebar signOut={signOut} />

      {/* Contenido + header móvil */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <MobileNav signOut={signOut} />
        <main className="w-[92%] mx-auto" style={{ maxWidth: 1100, paddingTop: 20, paddingBottom: "max(48px, env(safe-area-inset-bottom))" }}>
          {business?.status === "suspended" ? (
            <SuspensionBanner reason={business.suspended_reason} />
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
