"use client";

import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, DELIVERY_MODES, type DeliveryMode } from "@/lib/constants";

/**
 * Dos tarjetas-radio grandes: "Lunes a Viernes" o "Todos los días". Es la
 * unica forma de elegir dias de entrega en la app.
 */
export function DeliveryModeSelector({
  name,
  value,
  onChange,
  className,
}: {
  name: string;
  value: DeliveryMode | null;
  onChange: (mode: DeliveryMode) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Días de entrega"
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}
    >
      {DELIVERY_MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <label
            key={mode.value}
            className={cn(
              "relative flex cursor-pointer flex-col gap-3 rounded-lg p-5 shadow-soft transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
              selected
                ? "bg-surface-container-high ring-2 ring-primary"
                : "bg-surface hover:bg-surface-container-low"
            )}
          >
            <input
              type="radio"
              name={name}
              value={mode.value}
              checked={selected}
              onChange={() => onChange(mode.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "material-symbols-outlined absolute right-4 top-4",
                selected ? "text-primary" : "text-outline-variant"
              )}
              style={selected ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {selected ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className="pr-8">
              <span className="block font-serif text-headline-sm text-primary">{mode.label}</span>
              <span className="font-sans text-label-sm text-on-surface-variant">
                {mode.description}
              </span>
            </span>
            <span className="flex gap-1" aria-hidden>
              {DAYS_OF_WEEK.map((day) => (
                <span
                  key={day.value}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full font-sans text-[12px] font-semibold",
                    mode.days.includes(day.value)
                      ? selected
                        ? "bg-primary text-on-primary"
                        : "bg-primary/15 text-primary"
                      : "bg-surface-container-highest text-outline"
                  )}
                >
                  {day.short}
                </span>
              ))}
            </span>
          </label>
        );
      })}
    </div>
  );
}
