// Solo para uso en el servidor (Server Components/Actions): usa el cliente
// con service role para leer emails de auth.users.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SubscriberSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  currentSubscription: {
    id: string;
    status: string;
    frequency: string | null;
    planName: string | null;
  } | null;
}

/**
 * Directorio de suscriptores para el panel admin: junta profiles+subscriptions
 * (via RLS, con la sesion del propio admin) con el email real de auth.users
 * (via el cliente con service role, ya que profiles no guarda el email).
 * Si SUPABASE_SERVICE_ROLE_KEY no esta configurada, se degrada mostrando
 * el resto de datos sin email en vez de romper la pagina.
 */
export async function getSubscriberDirectory(): Promise<SubscriberSummary[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, created_at, subscriptions(id, status, created_at, subscription_plans(name, delivery_frequency))"
    )
    .eq("role", "user")
    .order("created_at", { ascending: false });

  const emailById = await getEmailMap();

  return (profiles ?? []).map((profile) => {
    const mostRecent = [...profile.subscriptions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: emailById.get(profile.id) ?? null,
      createdAt: profile.created_at,
      currentSubscription: mostRecent
        ? {
            id: mostRecent.id,
            status: mostRecent.status,
            frequency: mostRecent.subscription_plans?.delivery_frequency ?? null,
            planName: mostRecent.subscription_plans?.name ?? null,
          }
        : null,
    };
  });
}

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

async function getEmailMap(): Promise<Map<string, string>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    return new Map(data.users.map((user) => [user.id, user.email ?? ""]));
  } catch {
    // Sin SUPABASE_SERVICE_ROLE_KEY configurada: seguimos sin emails.
    return new Map();
  }
}
