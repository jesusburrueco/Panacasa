"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DeliveryPointActionState {
  error: string | null;
}

function parseCoordinate(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim());
  return String(value ?? "").trim() && Number.isFinite(parsed) ? parsed : null;
}

function readPointForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    zoneId: String(formData.get("zoneId") ?? ""),
    lat: parseCoordinate(formData.get("lat")),
    lng: parseCoordinate(formData.get("lng")),
  };
}

export async function createDeliveryPointAction(
  _prevState: DeliveryPointActionState,
  formData: FormData
): Promise<DeliveryPointActionState> {
  const { name, address, zoneId, lat, lng } = readPointForm(formData);

  if (!name) return { error: "El nombre de la urbanización es obligatorio." };
  if (lat == null || lng == null) return { error: "Haz click en el mapa para colocar el punto." };

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_points").insert({
    name,
    address: address || null,
    zone_id: zoneId || null,
    lat,
    lng,
  });

  if (error) {
    console.error("[createDeliveryPointAction] Supabase error:", error);
    return { error: "No se pudo guardar el punto. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function updateDeliveryPointAction(
  pointId: string,
  _prevState: DeliveryPointActionState,
  formData: FormData
): Promise<DeliveryPointActionState> {
  const { name, address, zoneId, lat, lng } = readPointForm(formData);

  if (!name) return { error: "El nombre de la urbanización es obligatorio." };
  if (lat == null || lng == null) return { error: "Haz click en el mapa para colocar el punto." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_points")
    .update({ name, address: address || null, zone_id: zoneId || null, lat, lng })
    .eq("id", pointId);

  if (error) {
    console.error("[updateDeliveryPointAction] Supabase error:", error);
    return { error: "No se pudo actualizar el punto. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

/** Guarda la nueva posicion tras arrastrar el marcador en el mapa. */
export async function moveDeliveryPointAction(
  pointId: string,
  lat: number,
  lng: number
): Promise<DeliveryPointActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_points").update({ lat, lng }).eq("id", pointId);

  if (error) {
    console.error("[moveDeliveryPointAction] Supabase error:", error);
    return { error: "No se pudo mover el punto." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function deleteDeliveryPointAction(pointId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_points").delete().eq("id", pointId);
  if (error) {
    console.error("[deleteDeliveryPointAction] Supabase error:", error);
  }
  revalidatePath("/admin/zonas");
}
