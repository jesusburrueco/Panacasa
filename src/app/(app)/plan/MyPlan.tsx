import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PlanPriceTag } from "@/components/plan/PlanPriceTag";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, formatDeliveryDays, sortDays } from "@/lib/constants";
import { getPlanPrice, modalityFromDays, modalityLabel } from "@/lib/plan-pricing";
import type { Tables } from "@/lib/supabase/types";
import {
  pauseSubscriptionAction,
  resumeSubscriptionAction,
} from "@/lib/supabase/subscription-actions";
import { ChangePlanPanel } from "./ChangePlanPanel";
import { PendingExtraOrders } from "@/components/cart/PendingExtraOrders";
import type { PendingExtraOrder } from "@/lib/supabase/cart-queries";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";

type Plan = Tables<"subscription_plans">;

export interface MyPlanSubscription {
  id: string;
  status: string;
  subscription_plans: Plan | null;
  subscription_items: {
    id: string;
    quantity: number;
    products: Pick<Tables<"products">, "id" | "name" | "slug" | "image_url"> | null;
  }[];
}

const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-primary text-on-primary" },
  paused: { label: "Pausada", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  past_due: { label: "Pago pendiente", className: "bg-error-container text-on-error-container" },
};

export function MyPlan({
  subscription,
  deliveryDays,
  plans,
  extraOrders,
  today,
}: {
  subscription: MyPlanSubscription;
  deliveryDays: string[];
  plans: Plan[];
  extraOrders: PendingExtraOrder[];
  today: string;
}) {
  const plan = subscription.subscription_plans;
  const modality = modalityFromDays(deliveryDays);
  const days = sortDays(deliveryDays);
  const status = statusLabel[subscription.status];
  const breadsPerDelivery = subscription.subscription_items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-margin-mobile py-section-gap md:px-margin-desktop">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-display-lg-mobile text-primary md:text-display-lg">
            Mi plan
          </h1>
          <p className="font-sans text-body-lg text-on-surface-variant">
            Revisa tu suscripción, cambia de plan o pausa tus entregas cuando lo necesites.
          </p>
        </div>
        <Link
          href="/perfil"
          className="flex w-fit items-center gap-2 font-sans text-label-md text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Volver a mi perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Resumen del plan */}
        <section className="lg:col-span-5">
          <div className="h-full rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-fixed p-6 text-on-tertiary-fixed shadow-soft md:p-8">
            <div className="mb-6 flex items-start justify-between">
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-sans text-label-sm uppercase tracking-widest",
                  status?.className
                )}
              >
                {status?.label ?? subscription.status}
              </span>
              <span
                className="material-symbols-outlined text-2xl text-on-tertiary-fixed-variant"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
            </div>

            <h2 className="mb-4 font-serif text-headline-md">{plan?.name ?? "Plan"}</h2>
            {plan && <PlanPriceTag price={getPlanPrice(plan, modality)} size="lg" className="mb-6" />}

            <dl className="space-y-4 border-t border-on-tertiary-fixed/15 pt-6 font-sans">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-label-md">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  Modalidad
                </dt>
                <dd className="text-body-md font-semibold">{modalityLabel(modality)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-label-md">
                  <span className="material-symbols-outlined text-[20px]">bakery_dining</span>
                  Barras por día
                </dt>
                <dd className="text-body-md font-semibold">{plan?.breads_per_day ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="flex flex-col gap-gutter lg:col-span-7">
          {/* Panes de la suscripcion */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-headline-sm text-primary">Tus panes</h2>
              <span className="font-sans text-label-md text-on-surface-variant">
                {breadsPerDelivery} {breadsPerDelivery === 1 ? "barra" : "barras"} por entrega
              </span>
            </div>
            {subscription.subscription_items.length === 0 ? (
              <Card className="text-center">
                <p className="font-sans text-body-md text-on-surface-variant">
                  Tu suscripción no tiene panes seleccionados.
                </p>
              </Card>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {subscription.subscription_items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg bg-surface-container-low p-3 shadow-soft"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-DEFAULT bg-surface-container-highest">
                      {item.products?.image_url ? (
                        <Image
                          src={item.products.image_url}
                          alt={item.products.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined absolute inset-0 m-auto h-fit w-fit text-outline">
                          bakery_dining
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.products ? (
                        <Link
                          href={`/catalogo/${item.products.slug}`}
                          className="block truncate font-sans text-label-md text-on-surface hover:text-primary"
                        >
                          {item.products.name}
                        </Link>
                      ) : (
                        <p className="font-sans text-label-md text-on-surface">Pan no disponible</p>
                      )}
                      <p className="font-sans text-label-sm text-on-surface-variant">
                        × {item.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PendingExtraOrders orders={extraOrders} today={today} />

          {/* Dias de entrega */}
          <section>
            <h2 className="mb-4 font-serif text-headline-sm text-primary">Días de entrega</h2>
            <Card className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <span
                    key={day.value}
                    title={day.label}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full font-sans text-label-md",
                      days.includes(day.value)
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-outline"
                    )}
                  >
                    {day.short}
                  </span>
                ))}
              </div>
              <p className="font-sans text-body-md text-on-surface-variant">
                {formatDeliveryDays(days)}.{" "}
                <Link href="/perfil" className="text-primary hover:underline">
                  Cambiar mis días
                </Link>
              </p>
            </Card>
          </section>
        </div>
      </div>

      {/* Acciones */}
      <section className="mt-section-gap">
        <ChangePlanPanel
          subscriptionId={subscription.id}
          currentPlanId={plan?.id ?? null}
          currentModality={modality}
          plans={plans}
        />

        <div className="mt-8 flex flex-wrap gap-3">
          {subscription.status === "active" && (
            <form action={pauseSubscriptionAction.bind(null, subscription.id)}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border-2 border-primary px-6 py-3 font-sans text-label-md text-primary transition-all hover:bg-primary/5 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                Pausar suscripción
              </button>
            </form>
          )}
          {subscription.status === "paused" && (
            <form action={resumeSubscriptionAction.bind(null, subscription.id)}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                Reanudar suscripción
              </button>
            </form>
          )}
          <CancelSubscriptionButton subscriptionId={subscription.id} />
        </div>
      </section>
    </main>
  );
}
