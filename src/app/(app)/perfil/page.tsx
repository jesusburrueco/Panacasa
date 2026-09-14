import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  cancelSubscriptionAction,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
} from "@/lib/supabase/subscription-actions";
import { EditProfileModal } from "./EditProfileModal";

const subscriptionStatusLabel: Record<string, { label: string; className: string }> = {
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
  in_transit: { label: "En camino", chip: "bg-secondary-fixed text-on-secondary-fixed-variant", dot: "bg-secondary" },
  delivered: { label: "Entregado", chip: "bg-green-100 text-green-800", dot: "bg-green-600" },
  failed: { label: "Fallido", chip: "bg-error-container text-on-error-container", dot: "bg-error" },
};

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/perfil");
  }

  const [{ data: profile }, { data: deliveryZones }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*, delivery_zones(name)").eq("id", user.id).single(),
    supabase.from("delivery_zones").select("*").eq("is_active", true).order("name"),
    supabase
      .from("subscriptions")
      .select(
        "*, subscription_plans(*), subscription_items(quantity, products(name, price_cents))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

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

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
        new Date(profile.created_at)
      )
    : "";

  const status = subscription ? subscriptionStatusLabel[subscription.status] : null;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-margin-mobile py-section-gap md:px-margin-desktop">
      {/* Cabecera de usuario */}
      <header className="mb-12 flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-surface-container-highest bg-surface-container shadow-soft-lg">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              person
            </span>
          </div>
          <div>
            <h1 className="font-serif text-display-lg-mobile text-primary md:text-display-lg">
              Hola, {profile?.full_name?.split(" ")[0] ?? "de nuevo"}
            </h1>
            <p className="font-sans text-body-lg text-on-surface-variant">
              {memberSince && `Miembro desde ${memberSince}`}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {profile && <EditProfileModal profile={profile} deliveryZones={deliveryZones ?? []} />}
          <Link href="/plan">
            <Button variant="primary">Gestionar Entrega</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Columna izquierda: cuenta y suscripcion */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          {/* Datos personales */}
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-headline-sm text-primary">Datos Personales</h2>
            <Card className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                <div>
                  <p className="font-sans text-label-sm text-on-surface-variant">Correo</p>
                  <p className="font-sans text-body-md text-on-surface">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">call</span>
                <div>
                  <p className="font-sans text-label-sm text-on-surface-variant">Teléfono</p>
                  <p className="font-sans text-body-md text-on-surface">
                    {profile?.phone || "Sin definir"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">home</span>
                <div>
                  <p className="font-sans text-label-sm text-on-surface-variant">Dirección</p>
                  <p className="font-sans text-body-md text-on-surface">
                    {profile?.address ? (
                      <>
                        {profile.address}
                        <br />
                        {[profile.postal_code, profile.city].filter(Boolean).join(" ")}
                      </>
                    ) : (
                      "Sin definir"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">distance</span>
                <div>
                  <p className="font-sans text-label-sm text-on-surface-variant">Zona de reparto</p>
                  <p className="font-sans text-body-md text-on-surface">
                    {profile?.delivery_zones?.name ?? "Sin definir"}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Suscripcion */}
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-headline-sm text-primary">Tu Suscripción</h2>
            {subscription ? (
              <div className="relative overflow-hidden rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-fixed p-6 text-on-tertiary-fixed shadow-soft">
                <div className="mb-6 flex items-start justify-between">
                  <span
                    className={`rounded-full px-3 py-1 font-sans text-label-sm uppercase tracking-widest ${status?.className ?? ""}`}
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
                <h3 className="mb-2 font-serif text-headline-sm">
                  {subscription.subscription_plans?.name}
                </h3>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="font-serif text-display-lg-mobile text-on-tertiary-fixed-variant">
                    {formatPrice(subscription.subscription_plans?.price_cents ?? 0)}
                  </span>
                  <span className="font-sans text-label-md">
                    / {subscription.subscription_plans?.delivery_frequency}
                  </span>
                </div>
                <ul className="mb-8 space-y-3">
                  {subscription.subscription_items.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-sans text-body-md">
                        {item.products?.name} × {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  {subscription.status === "active" && (
                    <form action={pauseSubscriptionAction.bind(null, subscription.id)}>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 px-6 font-sans text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">pause_circle</span>
                        Pausar
                      </button>
                    </form>
                  )}
                  {subscription.status === "paused" && (
                    <form action={resumeSubscriptionAction.bind(null, subscription.id)}>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 px-6 font-sans text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        Reanudar
                      </button>
                    </form>
                  )}
                  {subscription.status !== "cancelled" && (
                    <form action={cancelSubscriptionAction.bind(null, subscription.id)}>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-full border-2 border-on-tertiary-fixed px-6 py-3 font-sans text-label-md transition-all hover:bg-black/5 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <Card className="space-y-4 border border-outline-variant/30 text-center">
                <p className="font-sans text-body-md text-on-surface-variant">
                  Todavía no tienes ninguna suscripción activa.
                </p>
                <Link
                  href="/plan"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-sm"
                >
                  Configurar mi plan
                </Link>
              </Card>
            )}
          </section>
        </div>

        {/* Columna derecha: historial de entregas */}
        <div className="lg:col-span-8">
          <section>
            <h2 className="mb-6 font-serif text-headline-sm text-primary">
              Historial de Entregas
            </h2>
            {deliveries.length === 0 ? (
              <Card className="border border-outline-variant/30 text-center">
                <p className="font-sans text-body-md text-on-surface-variant">
                  Todavía no hay entregas programadas para tu suscripción.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {deliveries.map((delivery) => {
                  const deliveryStatus =
                    deliveryStatusLabel[delivery.status] ?? deliveryStatusLabel.pending;
                  const date = new Date(delivery.scheduled_date);
                  return (
                    <div
                      key={delivery.id}
                      className="flex flex-col justify-between gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low md:flex-row md:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-md bg-surface-container-highest p-3 text-center font-sans font-bold leading-tight text-primary">
                          <span className="block text-label-sm uppercase">
                            {date.toLocaleDateString("es-ES", { month: "short" })}
                          </span>
                          <span className="text-headline-sm">{date.getDate()}</span>
                        </div>
                        <div>
                          <p className="font-sans text-body-lg font-medium text-on-surface">
                            {subscription?.subscription_plans?.name ?? "Suscripción"}
                          </p>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            Precio del plan &middot;{" "}
                            {formatPrice(subscription?.subscription_plans?.price_cents ?? 0)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 font-sans text-label-sm font-bold ${deliveryStatus.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${deliveryStatus.dot}`} />
                        {deliveryStatus.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
