"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ALL_DAYS, MAX_BREADS_PER_DAY, sortDays } from "@/lib/constants";

export interface PlanActionState {
  error: string | null;
}

/** Campo de precio en euros opcional: vacio -> null. */
function optionalPrice(label: string) {
  return z.preprocess(
    (value) => {
      const raw = String(value ?? "").trim().replace(",", ".");
      return raw === "" ? null : raw;
    },
    z.coerce
      .number({ error: `Introduce un ${label} válido.` })
      .min(0, `El ${label} no puede ser negativo.`)
      .nullable()
  );
}

const toCents = (euros: number | null) => (euros == null ? null : Math.round(euros * 100));

const planSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre del plan es obligatorio."),
    description: z.string().trim().max(280, "La descripción debe ser corta (máx. 280 caracteres)."),
    priceWeekdays: optionalPrice("precio lunes a viernes"),
    priceFullWeek: optionalPrice("precio lunes a lunes"),
    promoWeekdays: optionalPrice("precio promo lunes a viernes"),
    promoFullWeek: optionalPrice("precio promo lunes a lunes"),
    commercialDayPrice: optionalPrice("precio comercial por día"),
    commercialDayPromo: optionalPrice("precio comercial con oferta"),
    promoActive: z.boolean(),
    days: z
      .array(z.enum(ALL_DAYS as [string, ...string[]]))
      .min(1, "Selecciona al menos un día de reparto."),
    breadsPerDay: z.coerce
      .number()
      .int()
      .min(1, "Elige entre 1 y 3 barras por día.")
      .max(MAX_BREADS_PER_DAY, "Para más de 3 barras diarias el cliente debe contactar directamente."),
    isActive: z.boolean(),
  })
  .refine((plan) => plan.priceWeekdays != null || plan.priceFullWeek != null, {
    message: "Indica al menos un precio regular (lunes a viernes o lunes a lunes).",
  })
  .refine(
    (plan) => !plan.promoActive || plan.promoWeekdays != null || plan.promoFullWeek != null,
    { message: "Para activar la promo indica al menos un precio promocional." }
  );

function readPlanForm(formData: FormData) {
  const result = planSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    priceWeekdays: formData.get("priceWeekdays"),
    priceFullWeek: formData.get("priceFullWeek"),
    promoWeekdays: formData.get("promoWeekdays"),
    promoFullWeek: formData.get("promoFullWeek"),
    commercialDayPrice: formData.get("commercialDayPrice"),
    commercialDayPromo: formData.get("commercialDayPromo"),
    promoActive: formData.get("promoActive") === "on",
    days: formData.getAll("days").map(String),
    breadsPerDay: formData.get("breadsPerDay"),
    isActive: formData.get("isActive") === "on",
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Datos del plan no válidos.", values: null };
  }

  const { name, description, days, breadsPerDay, isActive, promoActive } = result.data;
  const priceWeekdaysCents = toCents(result.data.priceWeekdays);
  const priceFullWeekCents = toCents(result.data.priceFullWeek);
  // Precio semanal de referencia (dashboard, listados): el L-V si existe.
  const weeklyPriceCents = (priceWeekdaysCents ?? priceFullWeekCents)!;

  return {
    error: null,
    values: {
      name,
      description: description || null,
      delivery_days_of_week: sortDays(days),
      breads_per_day: breadsPerDay,
      weekly_price_cents: weeklyPriceCents,
      price_weekdays_cents: priceWeekdaysCents,
      price_full_week_cents: priceFullWeekCents,
      promo_weekdays_cents: toCents(result.data.promoWeekdays),
      promo_full_week_cents: toCents(result.data.promoFullWeek),
      commercial_day_price_cents: toCents(result.data.commercialDayPrice),
      commercial_day_promo_cents: toCents(result.data.commercialDayPromo),
      promo_active: promoActive,
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
