"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAYS, sortDays } from "@/lib/constants";
import {
  modalityDays,
  modalityFromDays,
  planSupportsModality,
  type PlanModality,
} from "@/lib/plan-pricing";

export interface SubscriptionActionState {
  error: string | null;
}

function readModality(formData: FormData): PlanModality {
  return formData.get("modality") === "full_week" ? "full_week" : "weekdays";
}

/**
 * Ajusta los dias de entrega del cliente a la modalidad elegida, respetando
 * su seleccion actual cuando ya encaja (la modalidad se deduce de ellos).
 */
function deliveryDaysForModality(
  current: readonly string[] | null | undefined,
  modality: PlanModality
): string[] {
  const days = sortDays(current ?? []);
  if (modality === "weekdays") {
    const weekdaysOnly = days.filter((day) => WEEKDAYS.includes(day));
    return weekdaysOnly.length > 0 ? weekdaysOnly : modalityDays("weekdays");
  }
  return modalityFromDays(days) === "full_week" ? days : modalityDays("full_week");
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
  const modality = readModality(formData);
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

  // Los albaranes solo miran profiles.delivery_days y la modalidad (L-V o
  // L-L) se deduce de ellos: se ajustan a la modalidad elegida (editables
  // despues desde "Mis dias de entrega").
  const { data: profile } = await supabase
    .from("profiles")
    .select("delivery_days")
    .eq("id", user.id)
    .single();
  await supabase
    .from("profiles")
    .update({ delivery_days: deliveryDaysForModality(profile?.delivery_days, modality) })
    .eq("id", user.id);

  revalidatePath("/perfil");
  revalidatePath("/plan");
  redirect("/plan");
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
  revalidatePath("/plan");
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
 * Upgrade/downgrade: cambia el plan (y la modalidad) de la suscripcion del
 * usuario. Si el nuevo plan admite menos panes por entrega, se recortan las
 * cantidades elegidas empezando por los ultimos panes.
 */
export async function changePlanAction(
  subscriptionId: string,
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
  const modality = readModality(formData);

  const [{ data: subscription }, { data: plan }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, plan_id, subscription_items(id, quantity)")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (!subscription) {
    return { error: "No encontramos tu suscripción." };
  }
  if (!plan) {
    return { error: "Selecciona un plan disponible." };
  }
  if (!planSupportsModality(plan, modality)) {
    return { error: "Ese plan no está disponible en la modalidad elegida." };
  }

  const { error: planError } = await supabase
    .from("subscriptions")
    .update({ plan_id: plan.id })
    .eq("id", subscription.id)
    .eq("user_id", user.id);

  if (planError) {
    console.error("[changePlanAction] Supabase error:", planError);
    return { error: "No se pudo cambiar de plan. Inténtalo de nuevo." };
  }

  let remaining = plan.max_breads;
  for (const item of subscription.subscription_items) {
    const quantity = Math.min(item.quantity, remaining);
    remaining -= quantity;
    if (quantity === item.quantity) continue;
    await (quantity > 0
      ? supabase.from("subscription_items").update({ quantity }).eq("id", item.id)
      : supabase.from("subscription_items").delete().eq("id", item.id));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("delivery_days")
    .eq("id", user.id)
    .single();
  await supabase
    .from("profiles")
    .update({ delivery_days: deliveryDaysForModality(profile?.delivery_days, modality) })
    .eq("id", user.id);

  revalidatePath("/perfil");
  revalidatePath("/plan");
  return { error: null };
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
