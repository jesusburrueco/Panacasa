"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
