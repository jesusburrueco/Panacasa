import { createClient } from "@/lib/supabase/server";

export interface SubscriberSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  /** profiles.address: se usa como "metodo de entrega" en el directorio. */
  address: string | null;
  createdAt: string;
  currentSubscription: {
    id: string;
    status: string;
    frequency: string | null;
    planName: string | null;
    nextDeliveryDate: string | null;
  } | null;
}

/**
 * Directorio de suscriptores para el panel admin: profiles LEFT JOIN
 * subscriptions LEFT JOIN subscription_plans LEFT JOIN deliveries (via RLS,
 * con la sesion del propio admin). El email sale directamente de
 * profiles.email (sincronizado por el trigger handle_new_user al registrarse
 * y, para los usuarios ya existentes, por la migracion
 * 20260929140000_profiles_email.sql) en vez de llamar a
 * auth.admin.listUsers/getUserById, que requiere SUPABASE_SERVICE_ROLE_KEY y
 * no es una consulta PostgREST normal.
 * No filtra por estado de suscripcion ni usa "!inner" en ningun embed, para
 * no excluir perfiles sin suscripcion o suscripciones sin entregas
 * programadas todavia.
 */
export async function getSubscriberDirectory(): Promise<SubscriberSummary[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      `
      id, full_name, email, address, created_at,
      subscriptions (
        id, status, created_at,
        subscription_plans ( name, delivery_frequency ),
        deliveries ( scheduled_date, status )
      )
    `
    )
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSubscriberDirectory] Error al consultar profiles/subscriptions:", error);
    return [];
  }

  return (profiles ?? []).map((profile) => {
    const mostRecent = [...profile.subscriptions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const nextDelivery = mostRecent
      ? [...mostRecent.deliveries]
          .filter((delivery) => delivery.status === "pending" || delivery.status === "in_transit")
          .sort(
            (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          )[0]
      : undefined;

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      address: profile.address,
      createdAt: profile.created_at,
      currentSubscription: mostRecent
        ? {
            id: mostRecent.id,
            status: mostRecent.status,
            frequency: mostRecent.subscription_plans?.delivery_frequency ?? null,
            planName: mostRecent.subscription_plans?.name ?? null,
            nextDeliveryDate: nextDelivery?.scheduled_date ?? null,
          }
        : null,
    };
  });
}
