import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/panel/Sidebar";
import { BanknoteIcon, BellIcon, CardIcon, DashboardIcon, ScanIcon, UsersIcon } from "@/components/panel/icons";

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

  const links = [
    { href: "/panel", label: "Dashboard", Icon: DashboardIcon },
    { href: "/panel/tarjetas", label: "Tarjetas", Icon: CardIcon },
    { href: "/panel/escanear", label: "Escanear", Icon: ScanIcon },
    { href: "/panel/clientes", label: "Clientes", Icon: UsersIcon },
    { href: "/panel/avisos", label: "Notificaciones", Icon: BellIcon },
    { href: "/panel/pagos", label: "Pagos", Icon: BanknoteIcon },
  ];

  return (
    <div style={{ background: "#20201F", minHeight: "100vh", color: "#F0F0EE", display: "flex" }}>
      <Sidebar signOut={signOut} />

      {/* Contenido + header móvil */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="md:hidden" style={{ borderBottom: "1px solid #3D3D3B", background: "#2A2A29" }}>
          <div className="w-[90%] mx-auto flex items-center justify-between" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <Link href="/panel" style={{ fontWeight: 800, fontSize: 17 }}>
              <span style={{ background: "#7AB619", color: "#20201F", borderRadius: 8, padding: "2px 8px", marginRight: 8 }}>F</span>
              Fidelización
            </Link>
            <form action={signOut}>
              <button type="submit" style={{ color: "#9A9A96", fontSize: 14, cursor: "pointer", background: "none", border: "none" }}>
                Cerrar sesión
              </button>
            </form>
          </div>
          <div style={{ borderTop: "1px solid #3D3D3B" }}>
            <div className="w-[90%] mx-auto flex gap-4" style={{ paddingTop: 10, paddingBottom: 10, fontSize: 14 }}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#9A9A96", display: "flex", alignItems: "center", gap: 6 }}>
                  <l.Icon size={16} />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="w-[90%] mx-auto" style={{ paddingTop: 24, paddingBottom: 48 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
