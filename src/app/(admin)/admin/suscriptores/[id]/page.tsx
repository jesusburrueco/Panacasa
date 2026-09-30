import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminSetSubscriptionStatusAction } from "@/lib/supabase/subscription-actions";
import { adminUpdateDeliveryDaysAction } from "@/lib/supabase/profile-actions";
import { upcomingDeliveryDates, formatDateEs } from "@/lib/logistics/types";
import { formatPrice } from "@/lib/utils";
import { DeliveryDaysForm } from "@/components/shared/DeliveryDaysForm";

const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-primary text-on-primary" },
  paused: { label: "Pausada", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  cancelled: {
    label: "Cancelada",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  past_due: { label: "Pago pendiente", className: "bg-error-container text-on-error-container" },
};

export default async function SuscriptorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, delivery_zones(name)")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const email = profile.email;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*), subscription_items(quantity, products(name, price_cents))")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const deliveryDays = profile.delivery_days ?? [];
  const upcoming =
    subscription?.status === "active" ? upcomingDeliveryDates(deliveryDays, 4) : [];

  const status = subscription ? statusLabel[subscription.status] : null;

  return (
    <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
      <nav className="mb-8 flex items-center gap-2 font-sans text-body-md text-on-surface-variant">
        <Link href="/admin/suscriptores" className="hover:text-primary">
          Directorio
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="border-b border-primary font-semibold text-primary">
          {profile.full_name ?? "Suscriptor"}
        </span>
      </nav>

      <header className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
          <div>
            <h1 className="mb-2 font-serif text-headline-md text-primary">
              {profile.full_name ?? "Suscriptor"}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span className="font-sans text-label-sm text-on-surface-variant">{email}</span>
              {status && (
                <span
                  className={`rounded-full px-3 py-1 font-sans text-label-sm font-bold uppercase tracking-wider ${status.className}`}
                >
                  {status.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {subscription && (
          <div className="flex flex-wrap gap-3">
            {subscription.status !== "active" && (
              <form
                action={adminSetSubscriptionStatusAction.bind(null, subscription.id, "active")}
              >
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  Activar
                </button>
              </form>
            )}
            {subscription.status === "active" && (
              <form
                action={adminSetSubscriptionStatusAction.bind(null, subscription.id, "paused")}
              >
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full border-2 border-outline-variant px-6 py-3 font-sans text-label-md text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                  Pausar
                </button>
              </form>
            )}
            {subscription.status !== "cancelled" && (
              <form
                action={adminSetSubscriptionStatusAction.bind(null, subscription.id, "cancelled")}
              >
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full border-2 border-error px-6 py-3 font-sans text-label-md text-error transition-all hover:bg-error/5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Cancelar
                </button>
              </form>
            )}
          </div>
        )}
      </header>

      <div className="mb-12 grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-lg bg-surface-container-low p-8 shadow-soft lg:col-span-2">
          <h2 className="mb-6 font-serif text-headline-sm text-primary">Datos de Suscripción</h2>
          {subscription ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <p className="mb-1 font-sans text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Plan Actual
                  </p>
                  <p className="font-serif text-headline-sm text-primary">
                    {subscription.subscription_plans?.name}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-sans text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Frecuencia
                  </p>
                  <p className="font-serif text-headline-sm text-primary">
                    {subscription.subscription_plans?.delivery_frequency}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-sans text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Precio
                  </p>
                  <p className="font-serif text-headline-sm text-primary">
                    {formatPrice(subscription.subscription_plans?.price_cents ?? 0)}
                  </p>
                </div>
              </div>
              <div className="my-6 h-px w-full bg-outline-variant/30" />
              <ul className="space-y-2">
                {subscription.subscription_items.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 font-sans text-body-md">
                    <span className="material-symbols-outlined text-tertiary">bakery_dining</span>
                    {item.products?.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-sans text-body-md text-on-surface-variant">
              Este usuario todavía no tiene ninguna suscripción.
            </p>
          )}
        </div>

        <div className="rounded-lg bg-surface-container-low p-8 shadow-soft">
          <h2 className="mb-6 font-serif text-headline-sm text-primary">Datos de Contacto</h2>
          <div className="space-y-4 font-sans text-body-md text-on-surface">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline">call</span>
              {profile.phone ?? "Sin definir"}
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline">home</span>
              <span>
                {profile.address ?? "Sin definir"}
                {profile.city && (
                  <>
                    <br />
                    {profile.postal_code} {profile.city}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-outline">distance</span>
              {profile.delivery_zones?.name ?? "Sin definir"}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-lg bg-surface-container-low p-8 shadow-soft">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-headline-sm text-primary">Días de entrega</h2>
            <p className="font-sans text-body-md text-on-surface-variant">
              Los albaranes de cada día incluyen a este cliente solo si el día está marcado y su
              suscripción está activa.
            </p>
          </div>
          {upcoming.length > 0 && (
            <p className="font-sans text-label-sm text-on-surface-variant">
              Próximas: {upcoming.map(formatDateEs).join(" · ")}
            </p>
          )}
        </div>
        <DeliveryDaysForm
          action={adminUpdateDeliveryDaysAction.bind(null, profile.id)}
          initialDays={deliveryDays}
        />
      </section>
    </main>
  );
}
