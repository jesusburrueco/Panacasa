"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/supabase/actions";

const navLinks = [
  { href: "/catalogo", label: "Catalogo" },
  { href: "/plan", label: "Mi Plan" },
  { href: "/perfil", label: "Perfil" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface shadow-soft">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-margin-mobile md:h-20 md:px-margin-desktop">
        <div className="flex items-center gap-10">
          <Link href="/catalogo" className="shrink-0">
            <Image
              src="/images/logo-panacasa.png"
              alt="PanACasa"
              width={640}
              height={640}
              priority
              className="h-9 w-9 md:h-11 md:w-11"
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-sans text-body-md transition-colors",
                    active
                      ? "border-b-2 border-primary font-bold text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar pan artesanal..."
              className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 font-sans text-body-md text-on-surface shadow-inset transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            aria-label="Notificaciones"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Link
            href="/pedido"
            aria-label="Cesta"
            className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">shopping_basket</span>
          </Link>
          <Link
            href="/perfil"
            aria-label="Mi perfil"
            className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-fixed bg-surface-container"
          >
            <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-on-surface-variant">
              person
            </span>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
