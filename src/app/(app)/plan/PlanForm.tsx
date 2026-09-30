"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import { DAYS_OF_WEEK, formatDeliveryDays, sortDays } from "@/lib/constants";
import type { Tables } from "@/lib/supabase/types";
import {
  createSubscriptionAction,
  type SubscriptionActionState,
} from "@/lib/supabase/subscription-actions";

type Plan = Tables<"subscription_plans">;
type Product = Tables<"products">;

const initialState: SubscriptionActionState = { error: null };

export function PlanForm({
  plans,
  products,
  preselectedSlug,
  preselectedQuantity,
}: {
  plans: Plan[];
  products: Product[];
  preselectedSlug?: string;
  preselectedQuantity: number;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const preselected = products.find((product) => product.slug === preselectedSlug);
    return preselected ? { [preselected.id]: Math.max(1, preselectedQuantity) } : {};
  });
  const [state, formAction, isPending] = useActionState(createSubscriptionAction, initialState);

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const maxBreads = selectedPlan?.max_breads ?? 0;
  const totalBreads = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity })),
    [quantities]
  );

  function updateQuantity(productId: string, delta: number) {
    setQuantities((prev) => {
      const current = prev[productId] ?? 0;
      if (delta > 0 && totalBreads >= maxBreads) return prev;
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  }

  return (
    <form action={formAction} className="space-y-12">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {state.error && (
        <p
          role="alert"
          className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <section>
        <h2 className="mb-4 font-serif text-headline-sm text-primary">1. Elige tu plan</h2>
        {plans.length === 0 ? (
          <p className="font-sans text-body-md text-on-surface-variant">
            No hay planes disponibles en este momento.
          </p>
        ) : (
          <div role="radiogroup" aria-label="Planes" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={plan.id === planId}
                onSelect={() => setPlanId(plan.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-headline-sm text-primary">2. Elige tus panes</h2>
          <span className="font-sans text-label-md text-on-surface-variant">
            {totalBreads} / {maxBreads} panes
          </span>
        </div>
        {products.length === 0 ? (
          <p className="font-sans text-body-md text-on-surface-variant">
            No hay panes disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((product) => {
              const quantity = quantities[product.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4 shadow-soft"
                >
                  <div>
                    <p className="font-sans text-label-md text-on-surface">{product.name}</p>
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      {formatPrice(product.price_cents)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={quantity === 0}
                      aria-label={`Quitar ${product.name}`}
                      className="rounded-full p-1 text-primary transition-transform hover:scale-125 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="w-4 text-center font-sans font-bold text-primary">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={totalBreads >= maxBreads}
                      aria-label={`Añadir ${product.name}`}
                      className="rounded-full p-1 text-primary transition-transform hover:scale-125 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || items.length === 0 || !planId}
      >
        {isPending ? "Guardando..." : "Confirmar suscripción"}
      </Button>
    </form>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const days = sortDays(plan.delivery_days_of_week);
  // Planes anteriores a los repartos por dia de la semana no tienen dias ni
  // precio semanal: se muestran con su precio y frecuencia originales.
  const weeklyPrice = plan.weekly_price_cents;
  const isWeekly = weeklyPrice != null && days.length > 0;
  const weeklyTotal = days.length * plan.breads_per_day;

  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-4 rounded-lg p-6 shadow-soft transition-all hover:shadow-soft-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
        selected
          ? "bg-surface-container-high ring-2 ring-primary"
          : "bg-surface-container-low"
      )}
    >
      <input
        type="radio"
        name="plan"
        value={plan.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {selected && (
        <span className="material-symbols-outlined absolute right-4 top-4 text-primary">
          check_circle
        </span>
      )}

      <div className="pr-8">
        <h3 className="font-serif text-headline-sm text-primary">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
            {plan.description}
          </p>
        )}
      </div>

      <p>
        <span className="font-serif text-headline-md text-on-surface">
          {formatPrice(isWeekly ? weeklyPrice : plan.price_cents)}
        </span>
        <span className="font-sans text-label-md text-on-surface-variant">
          {" "}/ {isWeekly ? "semana" : plan.delivery_frequency}
        </span>
      </p>

      {isWeekly ? (
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
      ) : (
        <p className="border-t border-outline-variant/50 pt-4 font-sans text-label-sm text-on-surface-variant">
          Hasta {plan.max_breads} panes por entrega
        </p>
      )}
    </label>
  );
}
