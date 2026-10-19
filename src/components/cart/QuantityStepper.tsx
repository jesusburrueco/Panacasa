"use client";

import { cn } from "@/lib/utils";

export function QuantityStepper({
  quantity,
  onChange,
  label,
  size = "md",
  max = 20,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  label: string;
  size?: "sm" | "md";
  max?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-outline-variant bg-surface-container-low",
        size === "sm" ? "gap-1 px-1" : "gap-2 px-1.5 py-0.5"
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Quitar una unidad de ${label}`}
        className="rounded-full p-1 text-primary transition-colors hover:bg-surface-variant"
      >
        <span className={cn("material-symbols-outlined", size === "sm" ? "text-[18px]" : "text-[20px]")}>
          {quantity === 1 ? "delete" : "remove"}
        </span>
      </button>
      <span
        aria-live="polite"
        className="min-w-[1.5rem] text-center font-sans text-label-md font-bold text-primary"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={`Añadir una unidad de ${label}`}
        className="rounded-full p-1 text-primary transition-colors hover:bg-surface-variant disabled:opacity-30"
      >
        <span className={cn("material-symbols-outlined", size === "sm" ? "text-[18px]" : "text-[20px]")}>
          add
        </span>
      </button>
    </div>
  );
}
