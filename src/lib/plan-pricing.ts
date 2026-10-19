import { deliveryModeDays, type DayOfWeek, type DeliveryMode } from "@/lib/constants";
import type { Tables } from "@/lib/supabase/types";

type Plan = Tables<"subscription_plans">;

/** Modalidad de reparto: lunes a viernes o lunes a lunes (7 dias). */
export type PlanModality = DeliveryMode;

export const PLAN_MODALITIES: { value: PlanModality; label: string; short: string }[] = [
  { value: "weekdays", label: "Lunes a Viernes", short: "L-V" },
  { value: "full_week", label: "Lunes a Lunes", short: "L-L" },
];

export function modalityLabel(modality: PlanModality): string {
  return PLAN_MODALITIES.find((m) => m.value === modality)?.label ?? modality;
}

export function modalityDays(modality: PlanModality): DayOfWeek[] {
  return deliveryModeDays(modality);
}

/**
 * La modalidad no se guarda en la suscripcion: se deduce de los dias de
 * entrega del cliente (profiles.delivery_days). Cualquier dia de fin de
 * semana implica la modalidad lunes a lunes.
 */
export function modalityFromDays(days: readonly string[] | null | undefined): PlanModality {
  return days?.some((day) => day === "sabado" || day === "domingo") ? "full_week" : "weekdays";
}

export interface PlanPrice {
  /** Precio semanal regular de la modalidad (null si el plan no lo define). */
  regularCents: number | null;
  /** Precio semanal promocional, solo si la promo esta activa. */
  promoCents: number | null;
  /** Precio que paga el cliente: promo si hay, si no el regular. */
  finalCents: number | null;
  /** Lectura comercial por dia (regular y con oferta). */
  dayRegularCents: number | null;
  dayPromoCents: number | null;
}

export function getPlanPrice(plan: Plan, modality: PlanModality): PlanPrice {
  // Planes anteriores a los precios por modalidad solo tienen el precio
  // semanal: se usa como precio L-V.
  const regularCents =
    modality === "full_week"
      ? plan.price_full_week_cents
      : (plan.price_weekdays_cents ?? plan.weekly_price_cents);

  const promoRaw = modality === "full_week" ? plan.promo_full_week_cents : plan.promo_weekdays_cents;
  const promoCents =
    plan.promo_active && promoRaw != null && (regularCents == null || promoRaw < regularCents)
      ? promoRaw
      : null;

  const dayPromoCents =
    plan.promo_active &&
    plan.commercial_day_promo_cents != null &&
    (plan.commercial_day_price_cents == null ||
      plan.commercial_day_promo_cents < plan.commercial_day_price_cents)
      ? plan.commercial_day_promo_cents
      : null;

  return {
    regularCents,
    promoCents,
    finalCents: promoCents ?? regularCents,
    dayRegularCents: plan.commercial_day_price_cents,
    dayPromoCents,
  };
}

/** Si el plan tiene precio definido para la modalidad. */
export function planSupportsModality(plan: Plan, modality: PlanModality): boolean {
  return getPlanPrice(plan, modality).regularCents != null;
}
