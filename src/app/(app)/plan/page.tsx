import { createClient } from "@/lib/supabase/server";
import { DeliveryChecker } from "@/components/shared/DeliveryChecker";
import { CustomPlanContact } from "@/components/shared/CustomPlanContact";
import { PlanForm } from "./PlanForm";
import { MyPlan } from "./MyPlan";
import { getPendingExtraOrders } from "@/lib/supabase/cart-queries";
import { todayIsoMadrid } from "@/lib/logistics/types";

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
  const [{ data: plans }, { data: products }, { data: subscription }, { data: profile }] =
    await Promise.all([
      supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_cents"),
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      user
        ? supabase
            .from("subscriptions")
            .select(
              "id, status, subscription_plans(*), subscription_items(id, quantity, products(id, name, slug, image_url))"
            )
            .eq("user_id", user.id)
            .in("status", ["active", "paused", "past_due"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("profiles").select("delivery_days").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);

  // Con una suscripcion en curso, /plan pasa a ser "Mi plan".
  if (subscription && user) {
    const today = todayIsoMadrid();
    const extraOrders = await getPendingExtraOrders(user.id, today);
    return (
      <MyPlan
        subscription={subscription}
        deliveryDays={profile?.delivery_days ?? []}
        plans={plans ?? []}
        extraOrders={extraOrders}
        today={today}
      />
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
