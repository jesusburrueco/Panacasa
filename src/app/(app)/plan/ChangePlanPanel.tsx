"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlanCard } from "@/components/plan/PlanCard";
import { ModalitySelector } from "@/components/plan/ModalitySelector";
import { getPlanPrice, planSupportsModality, type PlanModality } from "@/lib/plan-pricing";
import type { Tables } from "@/lib/supabase/types";
import {
  changePlanAction,
  type SubscriptionActionState,
} from "@/lib/supabase/subscription-actions";

type Plan = Tables<"subscription_plans">;

const initialState: SubscriptionActionState = { error: null };

export function ChangePlanPanel({
  subscriptionId,
  currentPlanId,
  currentModality,
  plans,
}: {
  subscriptionId: string;
  currentPlanId: string | null;
  currentModality: PlanModality;
  plans: Plan[];
}) {
  const [open, setOpen] = useState(false);
  const [modality, setModality] = useState(currentModality);
  const [planId, setPlanId] = useState("");
  const [state, formAction, isPending] = useActionState(
    changePlanAction.bind(null, subscriptionId),
    initialState
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setOpen(false);
      setPlanId("");
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const isCurrent = (plan: Plan) => plan.id === currentPlanId && modality === currentModality;
  const currentPlan = plans.find((plan) => plan.id === currentPlanId);
  const currentPrice = currentPlan ? getPlanPrice(currentPlan, currentModality).finalCents : null;
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPrice = selectedPlan ? getPlanPrice(selectedPlan, modality).finalCents : null;
  const direction =
    selectedPrice == null || currentPrice == null || selectedPrice === currentPrice
      ? "Cambiar"
      : selectedPrice > currentPrice
        ? "Mejorar"
        : "Reducir";

  function changeModality(next: PlanModality) {
    setModality(next);
    if (selectedPlan && !planSupportsModality(selectedPlan, next)) setPlanId("");
  }

  if (!open) {
    return (
      <Button type="button" size="md" onClick={() => setOpen(true)}>
        <span className="material-symbols-outlined">swap_horiz</span>
        Cambiar de plan
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-6 rounded-lg bg-surface-container p-6 shadow-soft md:p-8">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="modality" value={modality} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-headline-sm text-primary">Cambiar de plan</h2>
          <p className="font-sans text-body-md text-on-surface-variant">
            Elige otro plan o modalidad. Si el nuevo plan incluye menos barras, ajustaremos tus
            panes.
          </p>
        </div>
        <ModalitySelector value={modality} onChange={changeModality} />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <div role="radiogroup" aria-label="Planes disponibles" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            modality={modality}
            name="newPlan"
            badge={plan.id === currentPlanId ? "Plan actual" : undefined}
            selected={plan.id === planId}
            onSelect={() => setPlanId(isCurrent(plan) ? "" : plan.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
        <Button type="submit" disabled={isPending || !planId}>
          {isPending ? "Guardando..." : `${direction} plan`}
        </Button>
      </div>
    </form>
  );
}
