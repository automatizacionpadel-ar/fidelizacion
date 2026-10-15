"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteIcon,
  BellIcon,
  CardIcon,
  CollapseIcon,
  DashboardIcon,
  LogoutIcon,
  ScanIcon,
  UsersIcon,
} from "./icons";

const LINKS = [
  { href: "/panel", label: "Dashboard", icon: DashboardIcon, exact: true },
  { href: "/panel/tarjetas", label: "Tarjetas", icon: CardIcon, exact: false },
  { href: "/panel/escanear", label: "Escanear", icon: ScanIcon, exact: false },
  { href: "/panel/clientes", label: "Clientes", icon: UsersIcon, exact: false },
  { href: "/panel/avisos", label: "Notificaciones", icon: BellIcon, exact: false },
  { href: "/panel/pagos", label: "Pagos", icon: BanknoteIcon, exact: false },
];

const STORAGE_KEY = "panel-sidebar-collapsed";

export function Sidebar({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignorar
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignorar
      }
      return next;
    });
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
        }}
      >
        <Link
          href="/panel"
          title="Fidelización"
          style={{
            fontWeight: 800,
            fontSize: 17,
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <span
            style={{
              background: "#7AB619",
              color: "#20201F",
              borderRadius: 8,
              padding: "2px 8px",
              marginRight: collapsed ? 0 : 8,
            }}
          >
            F
          </span>
          {!collapsed && <span style={{ whiteSpace: "nowrap" }}>Fidelización</span>}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Colapsar menú"
            aria-expanded={!collapsed}
            title="Colapsar menú"
            style={{
              color: "#9A9A96",
              background: "none",
              border: "1px solid #3D3D3B",
              borderRadius: 8,
              cursor: "pointer",
              padding: 6,
              display: "flex",
            }}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Expandir menú"
          aria-expanded={!collapsed}
          title="Expandir menú"
          style={{
            color: "#9A9A96",
            background: "none",
            border: "1px solid #3D3D3B",
            borderRadius: 8,
            cursor: "pointer",
            padding: 6,
            display: "flex",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      )}

      <nav className="flex flex-col gap-1" style={{ marginTop: 24, fontSize: 14 }}>
        {LINKS.map((l) => {
          const active = isActive(l.href, l.exact);
          const Icon = l.icon;
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
        <button
          type="submit"
          title={collapsed ? "Cerrar sesión" : undefined}
          style={{
            color: "#9A9A96",
            fontSize: 14,
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: collapsed ? "10px 0" : "10px 12px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            textAlign: "left",
          }}
        >
          <LogoutIcon size={20} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </form>
    </aside>
  );
}
