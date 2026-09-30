"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/constants";
import { ContactOptions } from "./ContactOptions";

/**
 * Disparador de contacto para el header: "icon" muestra solo el telefono,
 * "link" el texto "Contacto" como un enlace mas de la navegacion.
 */
export function ContactButton({
  variant = "link",
  className,
  onOpen,
}: {
  variant?: "icon" | "link";
  className?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={variant === "icon" ? "Contacto" : undefined}
        className={cn(
          variant === "icon"
            ? "rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
            : "font-sans text-body-md text-on-surface-variant transition-colors hover:text-primary",
          className
        )}
      >
        {variant === "icon" ? <span className="material-symbols-outlined">call</span> : "Contacto"}
      </button>

      {/* Portal: el header es sticky con z-index y atraparia el modal en su
          contexto de apilamiento (quedaria bajo MobileNav). */}
      {open && createPortal(<ContactModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="w-full max-w-md rounded-lg bg-surface-container-low p-6 text-left shadow-soft-lg md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-modal-title" className="font-serif text-headline-md text-primary">
              Hablemos
            </h2>
            <p className="mt-1 font-sans text-body-md text-on-surface-variant">
              ¿Dudas sobre tu plan o un pedido especial? Escríbenos o llámanos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Cerrar"
            className="rounded-full p-2 transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <ContactOptions variant="list" subject="Consulta PanACasa" />

        <p className="mt-6 flex items-center gap-2 font-sans text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-tertiary">location_on</span>
          {CONTACT.address}
        </p>
      </div>
    </div>
  );
}
