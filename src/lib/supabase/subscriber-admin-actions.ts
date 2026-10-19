"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BulkActionResult {
  error: string | null;
}

const STATUSES = ["active", "paused", "cancelled"] as const;
type BulkStatus = (typeof STATUSES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanIds(ids: unknown): string[] {
  return Array.isArray(ids) ? Array.from(new Set(ids.filter((id) => UUID.test(String(id))))) : [];
}

/** Comprueba que quien llama es admin (la RLS lo exige igualmente). */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { supabase, isAdmin: profile?.role === "admin" };
}

function revalidateSubscriberViews(profileIds: string[]) {
  revalidatePath("/admin/suscriptores");
  for (const id of profileIds) revalidatePath(`/admin/suscriptores/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/logistica");
}

/** Cambia el estado de varias suscripciones a la vez. */
export async function bulkSetSubscriptionStatusAction(
  subscriptionIds: string[],
  status: BulkStatus
): Promise<BulkActionResult> {
  const ids = cleanIds(subscriptionIds);
  if (ids.length === 0) return { error: "No hay suscripciones seleccionadas." };
  if (!STATUSES.includes(status)) return { error: "Estado no válido." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "No tienes permisos para esta acción." };

  const { error } = await supabase.from("subscriptions").update({ status }).in("id", ids);
  if (error) {
    console.error("[bulkSetSubscriptionStatusAction] Supabase error:", error);
    return { error: "No se pudieron actualizar las suscripciones." };
  }

  revalidateSubscriberViews([]);
  return { error: null };
}

/**
 * Elimina todas las suscripciones de los perfiles indicados, con sus
 * subscription_items y deliveries (tambien hay ON DELETE CASCADE, pero se
 * borran explicitamente para no depender de ello).
 *
 * Con `deleteProfiles` borra ademas la cuenta completa (auth.users, que
 * arrastra el perfil por cascada). Requiere SUPABASE_SERVICE_ROLE_KEY.
 */
export async function deleteSubscribersAction(
  profileIds: string[],
  deleteProfiles = false
): Promise<BulkActionResult> {
  const ids = cleanIds(profileIds);
  if (ids.length === 0) return { error: "No hay suscriptores seleccionados." };

  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: "No tienes permisos para esta acción." };

  const { data: subscriptions, error: listError } = await supabase
    .from("subscriptions")
    .select("id")
    .in("user_id", ids);

  if (listError) {
    console.error("[deleteSubscribersAction] Supabase error:", listError);
    return { error: "No se pudieron cargar las suscripciones a eliminar." };
  }

  const subscriptionIds = (subscriptions ?? []).map((sub) => sub.id);
  if (subscriptionIds.length > 0) {
    const steps = [
      () => supabase.from("deliveries").delete().in("subscription_id", subscriptionIds),
      () => supabase.from("subscription_items").delete().in("subscription_id", subscriptionIds),
      () => supabase.from("subscriptions").delete().in("id", subscriptionIds),
    ];
    for (const step of steps) {
      const { error } = await step();
      if (error) {
        console.error("[deleteSubscribersAction] Supabase error:", error);
        revalidateSubscriberViews(ids);
        return { error: "No se pudieron eliminar todas las suscripciones." };
      }
    }
  }

  if (deleteProfiles) {
    let admin;
    try {
      admin = createAdminClient();
    } catch (error) {
      console.error("[deleteSubscribersAction]", error);
      revalidateSubscriberViews(ids);
      return {
        error:
          "Suscripciones eliminadas, pero no se pudieron borrar los perfiles: falta SUPABASE_SERVICE_ROLE_KEY.",
      };
    }

    const failed: string[] = [];
    for (const id of ids) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) {
        console.error("[deleteSubscribersAction] deleteUser error:", id, error);
        failed.push(id);
      }
    }
    if (failed.length > 0) {
      revalidateSubscriberViews(ids);
      return {
        error: `Suscripciones eliminadas, pero ${failed.length} ${
          failed.length === 1 ? "perfil no se pudo" : "perfiles no se pudieron"
        } borrar.`,
      };
    }
  }

  revalidateSubscriberViews(ids);
  return { error: null };
}
