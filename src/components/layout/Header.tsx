"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ContactButton } from "@/components/shared/ContactButton";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/plan", label: "Suscripciones" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface shadow-soft">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo-panacasa.png"
            alt="PanACasa"
            width={640}
            height={640}
            priority
            className="h-9 w-9 md:h-11 md:w-11"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-body-md text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <ContactButton />
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="px-4 py-2 font-sans text-label-md text-on-surface-variant transition-colors hover:text-primary"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
          >
            Unete ahora
          </Link>
        </div>

        {/* En movil el contacto va fuera del menu desplegable: al cerrarlo se
            desmontaria el modal junto con el boton. */}
        <div className="flex items-center gap-1 md:hidden">
          <ContactButton variant="icon" onOpen={() => setOpen(false)} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Abrir menu"
            className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">
              {open ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-outline-variant/30 bg-surface px-margin-mobile pb-6 pt-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-DEFAULT px-3 py-3 font-sans text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-full border-2 border-primary px-6 py-3 text-center font-sans text-label-md text-primary"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/registro"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-6 py-3 text-center font-sans text-label-md text-on-primary"
            >
              Unete ahora
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
