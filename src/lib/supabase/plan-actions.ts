"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ALL_DAYS, MAX_BREADS_PER_DAY, sortDays } from "@/lib/constants";

export interface PlanActionState {
  error: string | null;
}

const planSchema = z.object({
  name: z.string().trim().min(1, "El nombre del plan es obligatorio."),
  description: z.string().trim().max(280, "La descripción debe ser corta (máx. 280 caracteres)."),
  weeklyPrice: z.coerce
    .number({ error: "Introduce un precio semanal válido." })
    .min(0, "El precio no puede ser negativo."),
  days: z
    .array(z.enum(ALL_DAYS as [string, ...string[]]))
    .min(1, "Selecciona al menos un día de reparto."),
  breadsPerDay: z.coerce
    .number()
    .int()
    .min(1, "Elige entre 1 y 3 barras por día.")
    .max(MAX_BREADS_PER_DAY, "Para más de 3 barras diarias el cliente debe contactar directamente."),
  isActive: z.boolean(),
});

function readPlanForm(formData: FormData) {
  const result = planSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    weeklyPrice: String(formData.get("weeklyPrice") ?? "").replace(",", "."),
    days: formData.getAll("days").map(String),
    breadsPerDay: formData.get("breadsPerDay"),
    isActive: formData.get("isActive") === "on",
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Datos del plan no válidos.", values: null };
  }

  const { name, description, weeklyPrice, days, breadsPerDay, isActive } = result.data;
  const weeklyPriceCents = Math.round(weeklyPrice * 100);

  return {
    error: null,
    values: {
      name,
      description: description || null,
      delivery_days_of_week: sortDays(days),
      breads_per_day: breadsPerDay,
      weekly_price_cents: weeklyPriceCents,
      // Columnas originales, mantenidas en sincronia para el resto de la app
      // (dashboard, perfil, checkout): cada entrega lleva `breads_per_day`
      // barras y el cobro es semanal.
      max_breads: breadsPerDay,
      delivery_frequency: "semanal",
      price_cents: weeklyPriceCents,
      is_active: isActive,
    },
  };
}

export async function createPlanAction(
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const { error: validationError, values } = readPlanForm(formData);
  if (!values) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.from("subscription_plans").insert(values);

  if (error) {
    console.error("[createPlanAction] Supabase error:", error);
    return { error: "No se pudo crear el plan. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/planes");
  revalidatePath("/plan");
  return { error: null };
}

export async function updatePlanAction(
  planId: string,
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const { error: validationError, values } = readPlanForm(formData);
  if (!values) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.from("subscription_plans").update(values).eq("id", planId);

  if (error) {
    console.error("[updatePlanAction] Supabase error:", error);
    return { error: "No se pudo actualizar el plan. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/planes");
  revalidatePath("/plan");
  return { error: null };
}

export async function deletePlanAction(planId: string): Promise<PlanActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("subscription_plans").delete().eq("id", planId);

  if (error) {
    console.error("[deletePlanAction] Supabase error:", error);
    // 23503: subscriptions.plan_id referencia el plan (on delete restrict).
    return {
      error:
        error.code === "23503"
          ? "Este plan tiene suscripciones asociadas. Desactívalo en lugar de eliminarlo."
          : "No se pudo eliminar el plan. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/admin/planes");
  revalidatePath("/plan");
  return { error: null };
}

export async function togglePlanActiveAction(planId: string, nextActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: nextActive })
    .eq("id", planId);
  if (error) {
    console.error("[togglePlanActiveAction] Supabase error:", error);
  }
  revalidatePath("/admin/planes");
  revalidatePath("/plan");
}
