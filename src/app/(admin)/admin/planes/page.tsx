import { createClient } from "@/lib/supabase/server";
import { PlanesManager } from "./PlanesManager";

export default async function AdminPlanesPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("is_active", { ascending: false })
    .order("weekly_price_cents", { ascending: true, nullsFirst: false });

  return (
    <main className="flex-1 px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-12">
        <h1 className="mb-2 font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Planes de suscripción
        </h1>
        <p className="max-w-xl font-sans text-body-lg text-on-surface-variant">
          Define qué días se reparte, cuántas barras recibe el cliente cada día y el precio
          semanal de cada plan.
        </p>
      </div>

      <PlanesManager plans={plans ?? []} />
    </main>
  );
}
