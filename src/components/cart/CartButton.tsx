"use client";

import { cartUnits } from "@/lib/cart";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { lines, open } = useCart();
  const units = cartUnits(lines);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={units > 0 ? `Abrir carrito (${units} productos)` : "Abrir carrito"}
      className="relative rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
    >
      <span className="material-symbols-outlined">shopping_basket</span>
      {units > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-tertiary px-1 font-sans text-[11px] font-bold leading-none text-on-tertiary">
          {units > 99 ? "99+" : units}
        </span>
      )}
    </button>
  );
}
