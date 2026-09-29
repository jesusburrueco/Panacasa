"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PickupPointActionState {
  error: string | null;
}

function readPickupPointForm(formData: FormData) {
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const zoneId = String(formData.get("zoneId") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    lat,
    lng,
    zoneId: zoneId || null,
    status: formData.get("status") === "cerrado" ? "cerrado" : "abierto",
  };
}

export async function createPickupPointAction(
  _prevState: PickupPointActionState,
  formData: FormData
): Promise<PickupPointActionState> {
  const { name, address, lat, lng, zoneId, status } = readPickupPointForm(formData);

  if (!name) {
    return { error: "El nombre del punto es obligatorio." };
  }
  if (!address) {
    return { error: "La dirección es obligatoria." };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "Las coordenadas no son válidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pickup_points").insert({
    name,
    address,
    lat,
    lng,
    zone_id: zoneId,
    status,
  });

  if (error) {
    return { error: "No se pudo crear el punto de recogida. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function updatePickupPointAction(
  pointId: string,
  _prevState: PickupPointActionState,
  formData: FormData
): Promise<PickupPointActionState> {
  const { name, address, lat, lng, zoneId, status } = readPickupPointForm(formData);

  if (!name) {
    return { error: "El nombre del punto es obligatorio." };
  }
  if (!address) {
    return { error: "La dirección es obligatoria." };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: "Las coordenadas no son válidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pickup_points")
    .update({
      name,
      address,
      lat,
      lng,
      zone_id: zoneId,
      status,
    })
    .eq("id", pointId);

  if (error) {
    return { error: "No se pudo actualizar el punto de recogida. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function deletePickupPointAction(pointId: string) {
  const supabase = await createClient();
  await supabase.from("pickup_points").delete().eq("id", pointId);
  revalidatePath("/admin/zonas");
}
