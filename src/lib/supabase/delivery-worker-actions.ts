"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DeliveryWorkerActionState {
  error: string | null;
}

function readWorkerForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createDeliveryWorkerAction(
  _prevState: DeliveryWorkerActionState,
  formData: FormData
): Promise<DeliveryWorkerActionState> {
  const { name, phone, email, isActive } = readWorkerForm(formData);

  if (!name) {
    return { error: "El nombre del repartidor es obligatorio." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_workers").insert({
    name,
    phone: phone || null,
    email: email || null,
    is_active: isActive,
  });

  if (error) {
    return { error: "No se pudo crear el repartidor. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/logistica");
  return { error: null };
}

export async function updateDeliveryWorkerAction(
  workerId: string,
  _prevState: DeliveryWorkerActionState,
  formData: FormData
): Promise<DeliveryWorkerActionState> {
  const { name, phone, email, isActive } = readWorkerForm(formData);

  if (!name) {
    return { error: "El nombre del repartidor es obligatorio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_workers")
    .update({
      name,
      phone: phone || null,
      email: email || null,
      is_active: isActive,
    })
    .eq("id", workerId);

  if (error) {
    return { error: "No se pudo actualizar el repartidor. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/logistica");
  return { error: null };
}

export async function deleteDeliveryWorkerAction(workerId: string) {
  const supabase = await createClient();
  await supabase.from("delivery_workers").delete().eq("id", workerId);
  revalidatePath("/admin/logistica");
}

export async function toggleDeliveryWorkerActiveAction(workerId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("delivery_workers").update({ is_active: nextActive }).eq("id", workerId);
  revalidatePath("/admin/logistica");
}
