"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { DashboardIcon, LogoutIcon, StoreIcon, UsersIcon } from "@/components/panel/icons";

const LINKS = [
  { href: "/aliado", label: "Dashboard", Icon: DashboardIcon, exact: true },
  { href: "/aliado/clientes", label: "Mis clientes", Icon: UsersIcon, exact: false },
  { href: "/aliado/perfil", label: "Mi perfil", Icon: StoreIcon, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AllySidebar({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex" style={{ width: 248, flexShrink: 0, height: "100vh", position: "sticky", top: 0, flexDirection: "column", background: "#2A2A29", borderRight: "1px solid #3D3D3B", padding: "20px 16px" }}>
      <Link href="/aliado" title="Simplificia" style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}>
        <Image
          src="/logo.png"
          alt="Simplificia"
          width={174}
          height={30}
          loading="eager"
          style={{ width: 174, height: "auto" }}
        />
      </Link>

      <nav className="flex flex-col gap-1" style={{ marginTop: 24, fontSize: 14 }}>
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href, l.exact);
          const Icon = l.Icon;
          return (
            <Link key={l.href} href={l.href} style={{ color: active ? "#F0F0EE" : "#9A9A96", background: active ? "#3D3D3B" : "transparent", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, fontWeight: active ? 700 : 400 }}>
              <Icon size={20} />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <form action={signOut} style={{ borderTop: "1px solid #3D3D3B", paddingTop: 16 }}>
        <button type="submit" style={{ color: "#9A9A96", fontSize: 14, cursor: "pointer", background: "none", border: "none", padding: "10px 12px", width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
          <LogoutIcon size={20} />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}

export function AllyMobileNav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden" style={{ borderBottom: "1px solid #3D3D3B", background: "#2A2A29", paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="w-[92%] mx-auto flex items-center justify-between" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <Link href="/aliado" title="Simplificia" aria-label="Simplificia">
          <Image
            src="/logo.png"
            alt="Simplificia"
            width={150}
            height={26}
            loading="eager"
            style={{ width: 150, height: "auto" }}
          />
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid #3D3D3B", background: open ? "#3D3D3B" : "transparent", color: "#F0F0EE", fontSize: 20, cursor: "pointer" }}>
          {open ? "×" : "☰"}
        </button>
      </div>
      {open && (
        <nav style={{ borderTop: "1px solid #3D3D3B" }}>
          <div className="w-[92%] mx-auto flex flex-col" style={{ paddingTop: 8, paddingBottom: 12 }}>
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href, l.exact);
              return (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, fontSize: 16, fontWeight: active ? 800 : 400, color: active ? "#7AB619" : "#F0F0EE", borderBottom: "1px solid #3D3D3B", padding: "6px 4px" }}>
                  <l.Icon size={20} />
                  {l.label}
                </Link>
              );
            })}
            <form action={signOut} style={{ paddingTop: 8 }}>
              <button type="submit" style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, fontSize: 16, color: "#9A9A96", background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
