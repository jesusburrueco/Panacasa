"use client";

import { useActionState, useState } from "react";
import type { DeliveryDaysActionState } from "@/lib/supabase/profile-actions";
import { DeliveryModeSelector } from "./DeliveryModeSelector";
import { deliveryModeFromDays, type DeliveryMode } from "@/lib/constants";

type DeliveryDaysAction = (
  prevState: DeliveryDaysActionState,
  formData: FormData
) => Promise<DeliveryDaysActionState>;

const initialState: DeliveryDaysActionState = { error: null, saved: false };

/** Selector de los dias de entrega de un cliente: lunes a viernes o todos los dias. */
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
  // Dias antiguos que no encajan en ninguna opcion: no se preselecciona nada.
  const [mode, setMode] = useState<DeliveryMode | null>(() =>
    deliveryModeFromDays(initialDays ?? [])
  );
  const [savedMode, setSavedMode] = useState(mode);
  const [lastState, setLastState] = useState(state);

  // Tras guardar con exito, la opcion actual pasa a ser la referencia.
  if (state !== lastState) {
    setLastState(state);
    if (state.saved) setSavedMode(mode);
  }

  const dirty = mode !== savedMode;
  const hasLegacyDays = savedMode === null && (initialDays?.length ?? 0) > 0;

  return (
    <form action={formAction} className="space-y-4">
      <DeliveryModeSelector name="deliveryMode" value={mode} onChange={setMode} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-label-sm text-on-surface-variant">
          {mode
            ? "Repartimos antes de las 8:00."
            : hasLegacyDays
              ? "Tus días actuales ya no están disponibles: elige una de las dos opciones."
              : "Sin días seleccionados: no recibirás entregas."}
        </p>
        <button
          type="submit"
          disabled={isPending || !dirty || !mode}
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
