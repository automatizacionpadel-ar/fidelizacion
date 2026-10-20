"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteIcon,
  BellIcon,
  CollapseIcon,
  DashboardIcon,
  LogoutIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/panel/icons";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon, exact: true },
  { href: "/admin/clientes", label: "Clientes", Icon: UsersIcon, exact: false },
  { href: "/admin/aliados", label: "Aliados", Icon: StoreIcon, exact: false },
  { href: "/admin/configuracion-bancaria", label: "Configuración bancaria", Icon: BanknoteIcon, exact: false },
  { href: "/admin/auditoria", label: "Auditoría", Icon: BellIcon, exact: false },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
      } catch {}
    });
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <aside
      className="hidden md:flex"
      style={{
        width: collapsed ? 76 : 248,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        flexDirection: "column",
        background: "#2A2A29",
        borderRight: "1px solid #3D3D3B",
        padding: collapsed ? "20px 12px" : "20px 16px",
        transition: "width 0.2s ease, padding 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 8 }}>
        <Link href="/admin" title="Administración" style={{ fontWeight: 800, fontSize: 16, padding: "4px 8px", display: "flex", alignItems: "center", minWidth: 0 }}>
          <span style={{ background: "#F0F0EE", color: "#20201F", borderRadius: 8, padding: "2px 8px", marginRight: collapsed ? 0 : 8 }}>A</span>
          {!collapsed && <span style={{ whiteSpace: "nowrap" }}>Administración</span>}
        </Link>
        {!collapsed && (
          <button type="button" onClick={toggle} aria-label="Colapsar menú" style={{ color: "#9A9A96", background: "none", border: "1px solid #3D3D3B", borderRadius: 8, cursor: "pointer", padding: 6, display: "flex" }}>
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {collapsed && (
        <button type="button" onClick={toggle} aria-label="Expandir menú" style={{ color: "#9A9A96", background: "none", border: "1px solid #3D3D3B", borderRadius: 8, cursor: "pointer", padding: 6, display: "flex", justifyContent: "center", marginTop: 16 }}>
          <CollapseIcon collapsed={collapsed} />
        </button>
      )}

      <nav className="flex flex-col gap-1" style={{ marginTop: 24, fontSize: 14 }}>
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href, l.exact);
          const Icon = l.Icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              title={collapsed ? l.label : undefined}
              style={{
                color: active ? "#F0F0EE" : "#9A9A96",
                background: active ? "#3D3D3B" : "transparent",
                borderRadius: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 10,
                fontWeight: active ? 700 : 400,
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <form action={signOut} style={{ borderTop: "1px solid #3D3D3B", paddingTop: 16 }}>
        <button type="submit" title={collapsed ? "Cerrar sesión" : undefined} style={{ color: "#9A9A96", fontSize: 14, cursor: "pointer", background: "none", border: "none", padding: collapsed ? "10px 0" : "10px 12px", width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, textAlign: "left" }}>
          <LogoutIcon size={20} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </form>
    </aside>
  );
}

export function AdminMobileNav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="md:hidden" style={{ borderBottom: "1px solid #3D3D3B", background: "#2A2A29", paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="w-[92%] mx-auto flex items-center justify-between" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <Link href="/admin" style={{ fontWeight: 800, fontSize: 16 }}>
          <span style={{ background: "#F0F0EE", color: "#20201F", borderRadius: 8, padding: "2px 8px", marginRight: 8 }}>A</span>
          Administración
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid #3D3D3B", background: open ? "#3D3D3B" : "transparent", color: "#F0F0EE", fontSize: 20, cursor: "pointer" }}
        >
          {open ? "×" : "☰"}
        </button>
      </div>
      {open && (
        <nav style={{ borderTop: "1px solid #3D3D3B", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="w-[92%] mx-auto flex flex-col" style={{ paddingTop: 8, paddingBottom: 12 }}>
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href, l.exact);
              return (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, fontSize: 16, fontWeight: active ? 800 : 400, color: active ? "#F0F0EE" : "#9A9A96", borderBottom: "1px solid #3D3D3B", padding: "6px 4px" }}>
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
