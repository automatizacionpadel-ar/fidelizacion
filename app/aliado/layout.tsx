import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAlly } from "@/lib/auth/roles";
import { AllyMobileNav, AllySidebar } from "@/components/ally/AllyNav";

export const dynamic = "force-dynamic";

export default async function AllyLayout({ children }: { children: React.ReactNode }) {
  await requireAlly();

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh", color: "#F0F0EE", display: "flex" }}>
      <AllySidebar signOut={signOut} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AllyMobileNav signOut={signOut} />
        <main className="w-[92%] mx-auto" style={{ maxWidth: 1100, paddingTop: 20, paddingBottom: "max(48px, env(safe-area-inset-bottom))" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
