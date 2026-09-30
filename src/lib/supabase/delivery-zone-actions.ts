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

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readZoneForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    postalCodes: parseListField(formData.get("postalCodes")),
    isActive: formData.get("isActive") === "on",
    centerLat: parseOptionalNumber(formData.get("centerLat")),
    centerLng: parseOptionalNumber(formData.get("centerLng")),
    radiusMeters: parseOptionalNumber(formData.get("radiusMeters")),
  };
}

export async function createDeliveryZoneAction(
  _prevState: DeliveryZoneActionState,
  formData: FormData
): Promise<DeliveryZoneActionState> {
  const {
    name,
    description,
    postalCodes,
    isActive,
    centerLat,
    centerLng,
    radiusMeters,
  } = readZoneForm(formData);

  if (!name) {
    return { error: "El nombre de la zona es obligatorio." };
  }
  if (centerLat == null || centerLng == null) {
    return { error: "Haz click en el mapa para fijar el centro de la zona." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").insert({
    name,
    description: description || null,
    postal_codes: postalCodes,
    is_active: isActive,
    center_lat: centerLat,
    center_lng: centerLng,
    radius_meters: radiusMeters,
  });

  if (error) {
    console.error("[createDeliveryZoneAction] Supabase error:", error);
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
  const {
    name,
    description,
    postalCodes,
    isActive,
    centerLat,
    centerLng,
    radiusMeters,
  } = readZoneForm(formData);

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
        is_active: isActive,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_meters: radiusMeters,
    })
    .eq("id", zoneId);

  if (error) {
    console.error("[updateDeliveryZoneAction] Supabase error:", error);
    return { error: "No se pudo actualizar la zona. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}

export async function deleteDeliveryZoneAction(zoneId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", zoneId);
  if (error) {
    console.error("[deleteDeliveryZoneAction] Supabase error:", error);
  }
  revalidatePath("/admin/zonas");
}

export async function toggleDeliveryZoneActiveAction(zoneId: string, nextActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_active: nextActive })
    .eq("id", zoneId);
  if (error) {
    console.error("[toggleDeliveryZoneActiveAction] Supabase error:", error);
  }
  revalidatePath("/admin/zonas");
}

/** Guarda el nuevo centro tras arrastrar el marcador de la zona en el mapa. */
export async function moveDeliveryZoneCenterAction(
  zoneId: string,
  lat: number,
  lng: number
): Promise<DeliveryZoneActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_zones")
    .update({ center_lat: lat, center_lng: lng })
    .eq("id", zoneId);

  if (error) {
    console.error("[moveDeliveryZoneCenterAction] Supabase error:", error);
    return { error: "No se pudo mover la zona." };
  }

  revalidatePath("/admin/zonas");
  return { error: null };
}
