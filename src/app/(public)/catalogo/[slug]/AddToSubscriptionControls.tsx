"use client";

import { useState } from "react";
import Link from "next/link";

export function AddToSubscriptionControls({ productSlug }: { productSlug: string }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="mt-12 flex flex-col gap-6 border-t border-outline-variant pt-10">
      <div className="flex items-center justify-center gap-8 self-start rounded-full border border-outline-variant bg-surface-container-low px-6 py-3">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Quitar unidad"
          className="text-primary transition-transform hover:scale-125"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
        <span className="font-sans text-body-lg font-bold text-primary">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          aria-label="Añadir unidad"
          className="text-primary transition-transform hover:scale-125"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={`/plan?producto=${encodeURIComponent(productSlug)}&cantidad=${quantity}`}
          className="flex flex-1 items-center justify-center gap-3 rounded-full bg-primary-container px-8 py-4 font-sans text-label-md uppercase tracking-widest text-on-primary-container shadow-soft-lg transition-all hover:bg-primary hover:text-on-primary active:scale-95"
        >
          <span className="material-symbols-outlined">calendar_today</span>
          Añadir a suscripción
        </Link>
        <button
          type="button"
          disabled
          title="Próximamente disponible"
          className="flex flex-1 cursor-not-allowed items-center justify-center gap-3 rounded-full border-2 border-primary/40 px-8 py-4 font-sans text-label-md uppercase tracking-widest text-primary/40"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          Compra única
        </button>
      </div>
    </div>
  );
}
