"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteIcon,
  BellIcon,
  CardIcon,
  DashboardIcon,
  ScanIcon,
  StoreIcon,
  UsersIcon,
} from "./icons";

const LINKS = [
  { href: "/panel", label: "Dashboard", Icon: DashboardIcon, exact: true },
  { href: "/panel/tarjetas", label: "Tarjetas", Icon: CardIcon, exact: false },
  { href: "/panel/sucursales", label: "Sucursales", Icon: StoreIcon, exact: false },
  { href: "/panel/escanear", label: "Escanear", Icon: ScanIcon, exact: false },
  { href: "/panel/clientes", label: "Clientes", Icon: UsersIcon, exact: false },
  { href: "/panel/avisos", label: "Notificaciones", Icon: BellIcon, exact: false },
  { href: "/panel/pagos", label: "Pagos", Icon: BanknoteIcon, exact: false },
];

// Header móvil con hamburguesa: logo + botón, y panel desplegable
// con los links en vertical. Solo se muestra en <md (el sidebar cubre desktop).
export function MobileNav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Al navegar se cierra solo.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <header className="md:hidden" style={{ borderBottom: "1px solid #3D3D3B", background: "#2A2A29", paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="w-[92%] mx-auto flex items-center justify-between" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <Link href="/panel" style={{ fontWeight: 800, fontSize: 17 }}>
          <span style={{ background: "#7AB619", color: "#20201F", borderRadius: 8, padding: "2px 8px", marginRight: 8 }}>F</span>
          Fidelización
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "1px solid #3D3D3B",
            background: open ? "#3D3D3B" : "transparent",
            cursor: "pointer",
          }}
        >
          <span style={bar(open, 1)} />
          <span style={bar(open, 2)} />
          <span style={bar(open, 3)} />
        </button>
      </div>

      {open && (
        <nav aria-label="Navegación del panel" style={{ borderTop: "1px solid #3D3D3B", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="w-[92%] mx-auto flex flex-col" style={{ paddingTop: 8, paddingBottom: 12 }}>
            {LINKS.map((l) => {
              const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 48,
                    padding: "6px 4px",
                    fontSize: 16,
                    fontWeight: active ? 800 : 400,
                    color: active ? "#7AB619" : "#F0F0EE",
                    borderBottom: "1px solid #3D3D3B",
                  }}
                >
                  <l.Icon size={20} />
                  {l.label}
                </Link>
              );
            })}
            <form action={signOut} style={{ paddingTop: 8 }}>
              <button
                type="submit"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  minHeight: 48, fontSize: 16, color: "#9A9A96",
                  background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
                }}
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}

function bar(open: boolean, i: number): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "block",
    width: 20,
    height: 2,
    borderRadius: 2,
    background: "#F0F0EE",
    transition: "transform 0.2s ease, opacity 0.2s ease",
  };
  if (!open) return base;
  if (i === 1) return { ...base, transform: "translateY(7px) rotate(45deg)" };
  if (i === 3) return { ...base, transform: "translateY(-7px) rotate(-45deg)" };
  return { ...base, opacity: 0 };
}
