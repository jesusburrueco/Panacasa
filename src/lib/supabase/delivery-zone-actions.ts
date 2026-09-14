"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DeliveryZoneActionState {
  error: string | null;
}

function parseListField(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readZoneForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    postalCodes: parseListField(formData.get("postalCodes")),
    deliveryDays: parseListField(formData.get("deliveryDays")),
  };
}

export async function createDeliveryZoneAction(
  _prevState: DeliveryZoneActionState,
  formData: FormData
): Promise<DeliveryZoneActionState> {
  const { name, description, postalCodes, deliveryDays } = readZoneForm(formData);

  if (!name) {
    return { error: "El nombre de la zona es obligatorio." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").insert({
    name,
    description: description || null,
    postal_codes: postalCodes,
    delivery_days: deliveryDays,
    is_active: true,
  });

  if (error) {
    return { error: "No se pudo crear la zona. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function updateDeliveryZoneAction(
  zoneId: string,
  _prevState: DeliveryZoneActionState,
  formData: FormData
): Promise<DeliveryZoneActionState> {
  const { name, description, postalCodes, deliveryDays } = readZoneForm(formData);

  if (!name) {
    return { error: "El nombre de la zona es obligatorio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({
      name,
      description: description || null,
      postal_codes: postalCodes,
      delivery_days: deliveryDays,
    })
    .eq("id", zoneId);

  if (error) {
    return { error: "No se pudo actualizar la zona. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function deleteDeliveryZoneAction(zoneId: string) {
  const supabase = await createClient();
  await supabase.from("delivery_zones").delete().eq("id", zoneId);
  revalidatePath("/admin/zonas");
}

export async function toggleDeliveryZoneActiveAction(zoneId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("delivery_zones").update({ is_active: nextActive }).eq("id", zoneId);
  revalidatePath("/admin/zonas");
}
