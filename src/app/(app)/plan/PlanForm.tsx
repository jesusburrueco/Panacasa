"use client";

import { useActionState, useMemo, useState } from "react";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
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
          <RadioGroup
            name="plan"
            value={planId}
            onChange={setPlanId}
            options={plans.map((plan) => ({
              value: plan.id,
              label: `${plan.name} · ${formatPrice(plan.price_cents)} / ${plan.delivery_frequency}`,
              description:
                plan.description ?? `Hasta ${plan.max_breads} panes por entrega`,
            }))}
          />
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
