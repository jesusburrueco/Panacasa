"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SubscriptionActionState {
  error: string | null;
}

interface SelectedItem {
  productId: string;
  quantity: number;
}

export async function createSubscriptionAction(
  _prevState: SubscriptionActionState,
  formData: FormData
): Promise<SubscriptionActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/plan");
  }

  const planId = String(formData.get("planId") ?? "");
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!planId) {
    return { error: "Selecciona un plan para continuar." };
  }

  let items: SelectedItem[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Hubo un problema con los panes seleccionados." };
  }

  items = items.filter(
    (item) => typeof item.productId === "string" && item.quantity > 0
  );

  if (items.length === 0) {
    return { error: "Elige al menos un pan para tu suscripción." };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({ user_id: user.id, plan_id: planId, status: "active" })
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    return { error: "No se pudo crear la suscripción. Inténtalo de nuevo." };
  }

  const { error: itemsError } = await supabase.from("subscription_items").insert(
    items.map((item) => ({
      subscription_id: subscription.id,
      product_id: item.productId,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    // Revertir la suscripcion si no se pudieron guardar los panes elegidos.
    await supabase.from("subscriptions").delete().eq("id", subscription.id);
    return { error: "No se pudieron guardar los panes elegidos. Inténtalo de nuevo." };
  }

  // Los albaranes solo miran profiles.delivery_days. Si el cliente aun no ha
  // elegido dias, se parte de los del plan como valor inicial (editable
  // despues desde "Mis dias de entrega").
  const [{ data: profile }, { data: plan }] = await Promise.all([
    supabase.from("profiles").select("delivery_days").eq("id", user.id).single(),
    supabase.from("subscription_plans").select("delivery_days_of_week").eq("id", planId).single(),
  ]);
  if (!profile?.delivery_days?.length && plan?.delivery_days_of_week.length) {
    await supabase
      .from("profiles")
      .update({ delivery_days: plan.delivery_days_of_week })
      .eq("id", user.id);
  }

  revalidatePath("/perfil");
  redirect("/perfil");
}

async function updateOwnSubscriptionStatus(subscriptionId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  revalidatePath("/perfil");
}

export async function pauseSubscriptionAction(subscriptionId: string) {
  await updateOwnSubscriptionStatus(subscriptionId, "paused");
}

export async function resumeSubscriptionAction(subscriptionId: string) {
  await updateOwnSubscriptionStatus(subscriptionId, "active");
}

export async function cancelSubscriptionAction(subscriptionId: string) {
  await updateOwnSubscriptionStatus(subscriptionId, "cancelled");
}

/**
 * Cambia el estado de la suscripcion de CUALQUIER usuario. Pensada para el
 * panel admin: no filtra por user_id, se apoya en la RLS de subscriptions
 * ("... or public.is_admin()") para autorizar o rechazar la operacion.
 */
export async function adminSetSubscriptionStatusAction(
  subscriptionId: string,
  status: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("subscriptions").update({ status }).eq("id", subscriptionId);

  revalidatePath("/admin/suscriptores");
}
