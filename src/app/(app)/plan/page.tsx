import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeliveryChecker } from "@/components/shared/DeliveryChecker";
import { CustomPlanContact } from "@/components/shared/CustomPlanContact";
import { PlanForm } from "./PlanForm";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string; cantidad?: string }>;
}) {
  const { producto, cantidad } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /plan es publico: se puede ver y configurar sin sesion. El login solo
  // se exige al confirmar la suscripcion (ver createSubscriptionAction).
  const [{ data: plans }, { data: products }, { data: activeSubscription }] = await Promise.all([
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_cents"),
    supabase.from("products").select("*").eq("is_active", true).order("name"),
    user
      ? supabase
          .from("subscriptions")
          .select("id, status, subscription_plans(name)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (activeSubscription) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-24 text-center md:px-margin-desktop">
        <span className="material-symbols-outlined rounded-full bg-primary-fixed p-4 text-4xl text-primary">
          task_alt
        </span>
        <h1 className="font-serif text-headline-md text-primary">Ya tienes un plan activo</h1>
        <p className="max-w-md font-sans text-body-lg text-on-surface-variant">
          Estás suscrito al plan {activeSubscription.subscription_plans?.name ?? ""}.
          Gestiona tus panes y tu entrega desde tu perfil.
        </p>
        <Link
          href="/perfil"
          className="rounded-full bg-primary px-8 py-4 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
        >
          Ir a mi perfil
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-margin-mobile py-section-gap md:px-margin-desktop">
      <div className="mb-12 text-center">
        <h1 className="mb-2 font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Configura tu plan
        </h1>
        <p className="font-sans text-body-lg text-on-surface-variant">
          Elige tus días de reparto, cuántas barras al día y los panes que quieres recibir.
        </p>
      </div>
      <DeliveryChecker className="mb-12" />
      <PlanForm
        plans={plans ?? []}
        products={products ?? []}
        preselectedSlug={producto}
        preselectedQuantity={cantidad ? Number(cantidad) : 1}
      />
      <CustomPlanContact className="mt-section-gap" />
    </main>
  );
}
