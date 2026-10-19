import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, formatDeliveryDays } from "@/lib/constants";
import { getPlanPrice, modalityDays, type PlanModality } from "@/lib/plan-pricing";
import type { Tables } from "@/lib/supabase/types";
import { PlanPriceTag } from "./PlanPriceTag";

type Plan = Tables<"subscription_plans">;

/** Tarjeta seleccionable (radio) de un plan con su precio segun la modalidad. */
export function PlanCard({
  plan,
  modality,
  selected,
  onSelect,
  name = "plan",
  badge,
}: {
  plan: Plan;
  modality: PlanModality;
  selected: boolean;
  onSelect: () => void;
  name?: string;
  badge?: string;
}) {
  // Los dias de reparto los marca la modalidad elegida (L-V o L-L).
  const days = modalityDays(modality);
  const price = getPlanPrice(plan, modality);
  const available = price.regularCents != null;
  const weeklyTotal = days.length * plan.breads_per_day;

  return (
    <label
      className={cn(
        "relative flex flex-col gap-4 rounded-lg p-6 shadow-soft transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
        available ? "cursor-pointer hover:shadow-soft-lg" : "cursor-not-allowed opacity-50",
        selected ? "bg-surface-container-high ring-2 ring-primary" : "bg-surface-container-low"
      )}
    >
      <input
        type="radio"
        name={name}
        value={plan.id}
        checked={selected}
        disabled={!available}
        onChange={onSelect}
        className="sr-only"
      />
      {selected && (
        <span className="material-symbols-outlined absolute right-4 top-4 text-primary">
          check_circle
        </span>
      )}

      <div className="pr-8">
        {badge && (
          <span className="mb-2 inline-block rounded-full bg-primary-fixed px-3 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-primary">
            {badge}
          </span>
        )}
        <h3 className="font-serif text-headline-sm text-primary">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
            {plan.description}
          </p>
        )}
      </div>

      <PlanPriceTag price={price} />

      <div className="space-y-3 border-t border-outline-variant/50 pt-4">
        <div className="flex gap-1" aria-label={formatDeliveryDays(days)}>
          {DAYS_OF_WEEK.map((day) => (
            <span
              key={day.value}
              title={day.label}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full font-sans text-[12px] font-semibold",
                days.includes(day.value)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-highest text-outline"
              )}
            >
              {day.short}
            </span>
          ))}
        </div>
        <ul className="space-y-1 font-sans text-label-sm text-on-surface-variant">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              calendar_month
            </span>
            {formatDeliveryDays(days)}
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              bakery_dining
            </span>
            {plan.breads_per_day} {plan.breads_per_day === 1 ? "barra" : "barras"} por día ·{" "}
            {weeklyTotal} a la semana
          </li>
        </ul>
      </div>
    </label>
  );
}
