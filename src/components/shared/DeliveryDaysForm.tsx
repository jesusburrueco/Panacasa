"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { ALL_DAYS, DAYS_OF_WEEK, WEEKDAYS, formatDeliveryDays, sortDays } from "@/lib/constants";
import type { DeliveryDaysActionState } from "@/lib/supabase/profile-actions";

type DeliveryDaysAction = (
  prevState: DeliveryDaysActionState,
  formData: FormData
) => Promise<DeliveryDaysActionState>;

const initialState: DeliveryDaysActionState = { error: null, saved: false };

/** Selector lunes..domingo de los dias de entrega de un cliente. */
export function DeliveryDaysForm({
  action,
  initialDays,
  submitLabel = "Guardar días",
}: {
  action: DeliveryDaysAction;
  initialDays: readonly string[] | null;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [days, setDays] = useState(() => sortDays(initialDays ?? []));
  const [savedDays, setSavedDays] = useState(days);
  const [lastState, setLastState] = useState(state);

  // Tras guardar con exito, los dias actuales pasan a ser la referencia.
  if (state !== lastState) {
    setLastState(state);
    if (state.saved) setSavedDays(days);
  }

  const dirty = days.join() !== savedDays.join();

  const toggle = (day: (typeof ALL_DAYS)[number]) =>
    setDays((prev) => sortDays(prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const selected = days.includes(day.value);
          return (
            <label key={day.value} className="cursor-pointer">
              <input
                type="checkbox"
                name="days"
                value={day.value}
                checked={selected}
                onChange={() => toggle(day.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-DEFAULT py-3 font-sans transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                  selected
                    ? "bg-primary text-on-primary shadow-soft"
                    : "bg-surface text-on-surface-variant hover:bg-surface-variant"
                )}
              >
                <span className="text-label-md">{day.short}</span>
                <span className="hidden text-[11px] opacity-80 sm:block">
                  {day.label.slice(0, 3)}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Lunes a viernes", preset: WEEKDAYS },
          { label: "Todos los días", preset: ALL_DAYS },
        ].map(({ label, preset }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDays([...preset])}
            className="rounded-full border border-outline-variant px-4 py-1.5 font-sans text-label-sm text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-label-sm text-on-surface-variant">
          {days.length === 0
            ? "Sin días seleccionados: no recibirás entregas."
            : `${formatDeliveryDays(days)} · ${days.length} ${days.length === 1 ? "entrega" : "entregas"}/semana`}
        </p>
        <button
          type="submit"
          disabled={isPending || !dirty}
          className="rounded-full bg-primary px-6 py-2.5 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : submitLabel}
        </button>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {state.error}
        </p>
      )}
      {state.saved && !dirty && (
        <p role="status" className="flex items-center gap-2 font-sans text-label-sm text-green-800">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Días de entrega guardados.
        </p>
      )}
    </form>
  );
}
