import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminSetSubscriptionStatusAction } from "@/lib/supabase/subscription-actions";
import { formatPrice } from "@/lib/utils";

const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-primary text-on-primary" },
  paused: { label: "Pausada", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  cancelled: {
    label: "Cancelada",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  past_due: { label: "Pago pendiente", className: "bg-error-container text-on-error-container" },
};

const deliveryStatusLabel: Record<string, { label: string; chip: string; dot: string }> = {
  pending: { label: "Pendiente", chip: "bg-orange-100 text-orange-800", dot: "bg-orange-600" },
  in_transit: {
    label: "En camino",
    chip: "bg-secondary-fixed text-on-secondary-fixed-variant",
    dot: "bg-secondary",
  },
  delivered: { label: "Entregado", chip: "bg-green-100 text-green-800", dot: "bg-green-600" },
  failed: { label: "Fallido", chip: "bg-error-container text-on-error-container", dot: "bg-error" },
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

  const deliveries = subscription
    ? (
        await supabase
          .from("deliveries")
          .select("*")
          .eq("subscription_id", subscription.id)
          .order("scheduled_date", { ascending: false })
          .limit(10)
      ).data ?? []
    : [];

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

      <section>
        <h2 className="mb-6 font-serif text-headline-sm text-primary">Historial de Entregas</h2>
        {deliveries.length === 0 ? (
          <p className="font-sans text-body-md text-on-surface-variant">
            Todavía no hay entregas programadas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container">
                    <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                      Fecha
                    </th>
                    <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                      Estado
                    </th>
                    <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {deliveries.map((delivery) => {
                    const dStatus =
                      deliveryStatusLabel[delivery.status] ?? deliveryStatusLabel.pending;
                    return (
                      <tr key={delivery.id} className="hover:bg-surface-container-low">
                        <td className="px-6 py-5 font-sans text-body-md text-on-surface">
                          {new Date(delivery.scheduled_date).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-label-sm font-semibold ${dStatus.chip}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${dStatus.dot}`} />
                            {dStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                          {delivery.notes ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
