import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/panel/Sidebar";
import { MobileNav } from "@/components/panel/MobileNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
          {children}
        </main>
      </div>
    </div>
  );
}
