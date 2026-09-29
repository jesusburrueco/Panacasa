"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DeliveryRouteActionState {
  error: string | null;
}

function readRouteForm(formData: FormData) {
  const workerId = String(formData.get("workerId") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    workerId: workerId || null,
    zoneId: zoneId || null,
    deliveryDate: String(formData.get("deliveryDate") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createDeliveryRouteAction(
  _prevState: DeliveryRouteActionState,
  formData: FormData
): Promise<DeliveryRouteActionState> {
  const { name, workerId, zoneId, deliveryDate, notes } = readRouteForm(formData);

  if (!name) {
    return { error: "El nombre de la ruta es obligatorio." };
  }
  if (!deliveryDate) {
    return { error: "La fecha de reparto es obligatoria." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_routes").insert({
    name,
    worker_id: workerId,
    zone_id: zoneId,
    delivery_date: deliveryDate,
    notes: notes || null,
    status: "pending",
  });

  if (error) {
    return { error: "No se pudo crear la ruta. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/logistica");
  return { error: null };
}

export async function updateDeliveryRouteAction(
  routeId: string,
  _prevState: DeliveryRouteActionState,
  formData: FormData
): Promise<DeliveryRouteActionState> {
  const { name, workerId, zoneId, deliveryDate, notes } = readRouteForm(formData);

  if (!name) {
    return { error: "El nombre de la ruta es obligatorio." };
  }
  if (!deliveryDate) {
    return { error: "La fecha de reparto es obligatoria." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_routes")
    .update({
      name,
      worker_id: workerId,
      zone_id: zoneId,
      delivery_date: deliveryDate,
      notes: notes || null,
    })
    .eq("id", routeId);

  if (error) {
    return { error: "No se pudo actualizar la ruta. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/logistica");
  return { error: null };
}

export async function deleteDeliveryRouteAction(routeId: string) {
  const supabase = await createClient();
  await supabase.from("delivery_routes").delete().eq("id", routeId);
  revalidatePath("/admin/logistica");
}

export async function setDeliveryRouteStatusAction(routeId: string, status: string) {
  const supabase = await createClient();
  await supabase.from("delivery_routes").update({ status }).eq("id", routeId);
  revalidatePath("/admin/logistica");
}
