"use client";

import { cn } from "@/lib/utils";
import { PLAN_MODALITIES, type PlanModality } from "@/lib/plan-pricing";

export function ModalitySelector({
  value,
  onChange,
  className,
}: {
  value: PlanModality;
  onChange: (modality: PlanModality) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Modalidad de reparto"
      className={cn("inline-flex rounded-full bg-surface-container-high p-1", className)}
    >
      {PLAN_MODALITIES.map((modality) => {
        const selected = modality.value === value;
        return (
          <button
            key={modality.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(modality.value)}
            className={cn(
              "rounded-full px-5 py-2 font-sans text-label-md transition-all",
              selected
                ? "bg-primary text-on-primary shadow-soft"
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            {modality.label}
          </button>
        );
      })}
    </div>
  );
}
