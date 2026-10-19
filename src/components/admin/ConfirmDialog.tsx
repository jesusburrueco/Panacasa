"use client";

import { useEffect, type ReactNode } from "react";

/** Modal de confirmacion para acciones destructivas. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, pending]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => !pending && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-lg bg-surface-container-low p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-4">
          <span className="material-symbols-outlined rounded-full bg-error-container p-2 text-error">
            warning
          </span>
          <h3 id="confirm-dialog-title" className="pt-1 font-serif text-headline-sm text-on-surface">
            {title}
          </h3>
        </div>
        <div className="space-y-4 font-sans text-body-md text-on-surface-variant">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className="rounded-full bg-error px-6 py-3 font-sans text-label-md text-on-error shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
