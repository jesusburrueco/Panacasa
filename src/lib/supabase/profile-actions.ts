"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deliveryModeDays, parseDeliveryMode } from "@/lib/constants";

export interface ProfileActionState {
  error: string | null;
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/perfil");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const deliveryZoneId = String(formData.get("deliveryZoneId") ?? "");

  if (!fullName) {
    return { error: "El nombre no puede estar vacío." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      city: city || null,
      postal_code: postalCode || null,
      delivery_zone_id: deliveryZoneId || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "No se pudo actualizar el perfil. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  return { error: null };
}

export interface DeliveryDaysActionState {
  error: string | null;
  saved: boolean;
}

/** Solo se aceptan las dos opciones: lunes a viernes o todos los dias. */
function readDeliveryDays(formData: FormData) {
  const mode = parseDeliveryMode(formData.get("deliveryMode"));
  return mode ? deliveryModeDays(mode) : null;
}

const invalidDays: DeliveryDaysActionState = {
  error: "Elige \"Lunes a Viernes\" o \"Todos los días\".",
  saved: false,
};

export async function updateMyDeliveryDaysAction(
  _prevState: DeliveryDaysActionState,
  formData: FormData
): Promise<DeliveryDaysActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/perfil");
  }

  const days = readDeliveryDays(formData);
  if (!days) return invalidDays;

  const { error } = await supabase
    .from("profiles")
    .update({ delivery_days: days })
    .eq("id", user.id);

  if (error) {
    console.error("[updateMyDeliveryDaysAction] Supabase error:", error);
    return { error: "No se pudieron guardar tus días de entrega.", saved: false };
  }

  revalidatePath("/perfil");
  revalidatePath("/plan");
  return { error: null, saved: true };
}

/** Edicion desde el admin (RLS: solo admins pueden actualizar perfiles ajenos). */
export async function adminUpdateDeliveryDaysAction(
  profileId: string,
  _prevState: DeliveryDaysActionState,
  formData: FormData
): Promise<DeliveryDaysActionState> {
  const days = readDeliveryDays(formData);
  if (!days) return invalidDays;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ delivery_days: days })
    .eq("id", profileId);

  if (error) {
    console.error("[adminUpdateDeliveryDaysAction] Supabase error:", error);
    return { error: "No se pudieron guardar los días de entrega.", saved: false };
  }

  revalidatePath(`/admin/suscriptores/${profileId}`);
  revalidatePath("/admin/logistica");
  return { error: null, saved: true };
}
