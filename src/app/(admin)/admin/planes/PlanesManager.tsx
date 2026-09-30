"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { cn, formatPrice } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  ALL_DAYS,
  DAYS_OF_WEEK,
  MAX_BREADS_PER_DAY,
  WEEKDAYS,
  formatDeliveryDays,
  sortDays,
  type DayOfWeek,
} from "@/lib/constants";
import {
  createPlanAction,
  deletePlanAction,
  togglePlanActiveAction,
  updatePlanAction,
  type PlanActionState,
} from "@/lib/supabase/plan-actions";

type Plan = Tables<"subscription_plans">;

const initialState: PlanActionState = { error: null };
const BREADS_OPTIONS = [1, 2, 3] as const;

const inputClass =
  "mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary";

export function PlanesManager({ plans }: { plans: Plan[] }) {
  const [modalPlan, setModalPlan] = useState<Plan | null | undefined>(undefined);
  const [isToggling, startToggle] = useTransition();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <OverLimitNotice />
        <button
          type="button"
          onClick={() => setModalPlan(null)}
          className="flex shrink-0 items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft-lg transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Crear Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-12 text-center shadow-soft">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">
            event_repeat
          </span>
          <p className="font-sans text-body-lg text-on-surface-variant">
            Todavía no hay planes. Crea el primero para que tus clientes puedan suscribirse.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-surface-container-low shadow-soft">
          {/* Cabecera de tabla (solo desktop) */}
          <div className="hidden grid-cols-[2fr_1fr_1.6fr_1fr_1fr_auto] gap-4 border-b border-outline-variant px-6 py-4 lg:grid">
            {["Plan", "Precio semanal", "Días de reparto", "Barras/día", "Estado", ""].map(
              (heading) => (
                <span
                  key={heading}
                  className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant"
                >
                  {heading}
                </span>
              )
            )}
          </div>

          <ul className="divide-y divide-outline-variant/50">
            {plans.map((plan) => {
              const days = sortDays(plan.delivery_days_of_week ?? [])
              const weeklyTotal = days.length * plan.breads_per_day;
              return (
                <li
                  key={plan.id}
                  className={cn(
                    "grid grid-cols-1 gap-4 px-6 py-5 transition-colors hover:bg-surface-container lg:grid-cols-[2fr_1fr_1.6fr_1fr_1fr_auto] lg:items-center",
                    !plan.is_active && "opacity-60"
                  )}
                >
                  <div>
                    <h3 className="font-serif text-headline-sm text-primary">{plan.name}</h3>
                    {plan.description && (
                      <p className="line-clamp-2 font-sans text-label-sm text-on-surface-variant">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="font-serif text-headline-sm text-on-surface">
                      {plan.weekly_price_cents != null
                        ? formatPrice(plan.weekly_price_cents)
                        : "—"}
                    </span>
                    <span className="font-sans text-label-sm text-on-surface-variant"> / semana</span>
                  </div>

                  <div className="space-y-2">
                    <DayChips days={days} />
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      {formatDeliveryDays(days)}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-label-md text-on-surface">
                      {plan.breads_per_day} {plan.breads_per_day === 1 ? "barra" : "barras"}/día
                    </p>
                    <p className="font-sans text-label-sm text-tertiary">
                      {weeklyTotal} barras/semana
                    </p>
                  </div>

                  <label className="relative inline-flex w-fit cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={plan.is_active}
                      disabled={isToggling}
                      onChange={() =>
                        startToggle(() => {
                          togglePlanActiveAction(plan.id, !plan.is_active);
                        })
                      }
                    />
                    <div className="relative h-6 w-11 rounded-full bg-surface-variant transition-colors peer-checked:bg-green-500" />
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    <span className="font-sans text-label-sm text-on-surface-variant">
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </label>

                  <div className="flex gap-1 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setModalPlan(plan)}
                      aria-label={`Editar ${plan.name}`}
                      className="rounded-full p-2 text-primary transition-colors hover:bg-surface-variant"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <DeletePlanButton plan={plan} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modalPlan !== undefined && (
        <PlanModal plan={modalPlan} onClose={() => setModalPlan(undefined)} />
      )}
    </div>
  );
}

function OverLimitNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-tertiary/30 bg-tertiary-fixed/40 px-5 py-4">
      <span className="material-symbols-outlined text-tertiary">info</span>
      <p className="font-sans text-label-md text-on-surface">
        Para pedidos de más de {MAX_BREADS_PER_DAY} barras diarias, el cliente debe contactar
        directamente.
      </p>
    </div>
  );
}

function DayChips({ days }: { days: readonly DayOfWeek[] }) {
  return (
    <div className="flex gap-1">
      {DAYS_OF_WEEK.map((day) => {
        const selected = days.includes(day.value);
        return (
          <span
            key={day.value}
            title={day.label}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full font-sans text-[12px] font-semibold",
              selected
                ? "bg-primary text-on-primary"
                : "bg-surface-container-highest text-outline"
            )}
          >
            {day.short}
          </span>
        );
      })}
    </div>
  );
}

function DeletePlanButton({ plan }: { plan: Plan }) {
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = () => {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    startDelete(async () => {
      const { error } = await deletePlanAction(plan.id);
      if (error) alert(error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Eliminar ${plan.name}`}
      className="rounded-full p-2 text-error transition-colors hover:bg-error-container disabled:opacity-40"
    >
      <span className="material-symbols-outlined">
        {isDeleting ? "hourglass_empty" : "delete"}
      </span>
    </button>
  );
}

function PlanModal({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const action = plan ? updatePlanAction.bind(null, plan.id) : createPlanAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  const [days, setDays] = useState<DayOfWeek[]>(() =>
    plan ? sortDays(plan.delivery_days_of_week) : [...WEEKDAYS]
  );
  const [breadsPerDay, setBreadsPerDay] = useState(plan?.breads_per_day ?? 1);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, onClose]);

  const toggleDay = (day: DayOfWeek) =>
    setDays((prev) => sortDays(prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const sameDays = (preset: readonly DayOfWeek[]) =>
    preset.length === days.length && preset.every((d) => days.includes(d));

  const weeklyTotal = days.length * breadsPerDay;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 id="plan-modal-title" className="font-serif text-headline-sm text-primary">
            {plan ? "Editar Plan" : "Crear Plan"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form action={formAction} className="space-y-6 p-6">
          {state.error && (
            <p
              role="alert"
              className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
            >
              {state.error}
            </p>
          )}

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Nombre del plan</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Plan Semanal Completo"
              defaultValue={plan?.name}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Precio semanal (€)
            </span>
            <input
              name="weeklyPrice"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="12.50"
              defaultValue={
                plan?.weekly_price_cents != null
                  ? (plan.weekly_price_cents / 100).toFixed(2)
                  : undefined
              }
              className={inputClass}
            />
          </label>

          <fieldset>
            <legend className="font-sans text-label-md text-on-surface-variant">
              Días de reparto
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: "Lunes a Viernes", days: WEEKDAYS },
                { label: "Lunes a Lunes (7 días)", days: ALL_DAYS },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDays([...preset.days])}
                  className={cn(
                    "rounded-full border px-4 py-1.5 font-sans text-label-sm transition-colors",
                    sameDays(preset.days)
                      ? "border-tertiary bg-tertiary-container text-on-tertiary-container"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const selected = days.includes(day.value);
                return (
                  <label key={day.value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="days"
                      value={day.value}
                      checked={selected}
                      onChange={() => toggleDay(day.value)}
                      className="peer sr-only"
                    />
                    <span
                      title={day.label}
                      className={cn(
                        "flex flex-col items-center rounded-DEFAULT py-2 font-sans transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                        selected
                          ? "bg-primary text-on-primary shadow-soft"
                          : "bg-surface text-on-surface-variant hover:bg-surface-variant"
                      )}
                    >
                      <span className="text-label-md">{day.short}</span>
                      <span className="text-[10px] opacity-80">{day.label.slice(0, 3)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-sans text-label-md text-on-surface-variant">
              Barras por día
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BREADS_OPTIONS.map((option) => (
                <label key={option} className="cursor-pointer">
                  <input
                    type="radio"
                    name="breadsPerDay"
                    value={option}
                    checked={breadsPerDay === option}
                    onChange={() => setBreadsPerDay(option)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-full py-3 font-sans text-label-md transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                      breadsPerDay === option
                        ? "bg-primary text-on-primary shadow-soft"
                        : "bg-surface text-on-surface-variant hover:bg-surface-variant"
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">bakery_dining</span>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-5 py-4">
            <span className="font-sans text-label-md text-on-surface-variant">
              Total por semana
              <span className="block font-sans text-label-sm text-outline">
                {days.length} {days.length === 1 ? "día" : "días"} × {breadsPerDay}{" "}
                {breadsPerDay === 1 ? "barra" : "barras"}/día
              </span>
            </span>
            <span className="font-serif text-headline-md text-primary">
              {weeklyTotal} <span className="text-body-md">barras</span>
            </span>
          </div>

          <p className="flex items-start gap-2 font-sans text-label-sm text-tertiary">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Para pedidos de más de {MAX_BREADS_PER_DAY} barras diarias, el cliente debe contactar
            directamente.
          </p>

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Descripción corta
            </span>
            <textarea
              name="description"
              rows={2}
              maxLength={280}
              placeholder="Pan recién horneado cada mañana laborable."
              defaultValue={plan?.description ?? ""}
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={plan?.is_active ?? true}
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="font-sans text-label-md text-on-surface-variant">
              Plan activo (visible para los clientes)
            </span>
          </label>

          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || days.length === 0}
              className="rounded-full bg-primary px-8 py-3 font-sans text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : plan ? "Guardar Cambios" : "Crear Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
