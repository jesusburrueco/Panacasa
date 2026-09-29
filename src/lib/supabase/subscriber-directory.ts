// Solo para uso en el servidor (Server Components/Actions): usa el cliente
// con service role para leer emails de auth.users.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
 * con la sesion del propio admin), combinado con el email real de
 * auth.users (via el cliente con service role, ya que profiles no guarda el
 * email). No filtra por estado de suscripcion ni usa "!inner" en ningun
 * embed, para no excluir perfiles sin suscripcion o suscripciones sin
 * entregas programadas todavia.
 * Si SUPABASE_SERVICE_ROLE_KEY no esta configurada, se degrada mostrando
 * el resto de datos sin email en vez de romper la pagina.
 */
export async function getSubscriberDirectory(): Promise<SubscriberSummary[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      `
      id, full_name, address, created_at,
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

  const emailById = await getEmailMap();

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
      email: emailById.get(profile.id) ?? null,
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

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) {
      console.error("[getUserEmail] Supabase error:", error);
      return null;
    }
    return data.user?.email ?? null;
  } catch (err) {
    console.error("[getUserEmail] No se pudo crear el cliente admin:", err);
    return null;
  }
}

async function getEmailMap(): Promise<Map<string, string>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.error("[getEmailMap] Supabase error:", error);
      return new Map();
    }
    return new Map(data.users.map((user) => [user.id, user.email ?? ""]));
  } catch (err) {
    // Sin SUPABASE_SERVICE_ROLE_KEY configurada: seguimos sin emails.
    console.error("[getEmailMap] No se pudo crear el cliente admin:", err);
    return new Map();
  }
}
