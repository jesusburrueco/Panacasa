"use client";

import { useState, useTransition } from "react";
import { cancelExtraOrderAction } from "@/lib/supabase/cart-actions";
import { useCart } from "./CartProvider";

export function CancelExtraOrderButton({
  orderId,
  disabled = false,
}: {
  orderId: string;
  disabled?: boolean;
}) {
  const { replaceLines, open } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (
      !confirm("¿Cancelar este pedido extra? Los productos volverán a tu carrito.")
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await cancelExtraOrderAction(orderId);
      replaceLines(result.lines);
      if (result.error) setError(result.error);
      else open();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={disabled || isPending}
        title={disabled ? "El reparto de hoy ya está en marcha" : undefined}
        className="flex items-center gap-2 rounded-full border-2 border-error px-5 py-2 font-sans text-label-md text-error transition-all hover:bg-error-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <span className="material-symbols-outlined text-[18px]">remove_shopping_cart</span>
        {isPending ? "Cancelando..." : "Cancelar pedido extra"}
      </button>
      {error && (
        <p role="alert" className="font-sans text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
