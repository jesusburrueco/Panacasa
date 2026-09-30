"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/supabase/actions";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/suscriptores", label: "Suscriptores", icon: "group" },
  { href: "/admin/catalogo", label: "Catalogo", icon: "bakery_dining" },
  { href: "/admin/planes", label: "Planes", icon: "event_repeat" },
  { href: "/admin/zonas", label: "Zonas y puntos", icon: "distance" },
  { href: "/admin/logistica", label: "Logistica", icon: "local_shipping" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-margin-mobile py-4 md:hidden">
        <span className="font-serif text-headline-sm text-primary">PanACasa</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu de administracion"
          className="rounded-full p-2 text-primary hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-inverse-surface/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant bg-surface-container-low pt-8 transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 px-6">
          <span className="font-serif text-headline-md text-primary">PanACasa</span>
          <p className="font-sans text-label-md text-on-surface-variant opacity-70">
            Panel de administracion
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navLinks.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 font-sans text-label-md transition-all",
                  active
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "text-on-surface-variant hover:scale-[1.02] hover:bg-surface-variant"
                )}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-outline-variant p-4">
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-2 font-sans text-label-md text-on-surface-variant transition-all hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">help</span>
            Soporte
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 font-sans text-label-md text-on-surface-variant transition-all hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
