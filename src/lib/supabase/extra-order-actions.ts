"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["pending", "delivered", "cancelled"] as const;

/**
 * Cambia el estado de un pedido extra desde el admin. La RLS de
 * extra_orders solo permite actualizar a los administradores.
 */
export async function setExtraOrderStatusAction(orderId: string, status: string) {
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;

  const supabase = await createClient();
  const { error } = await supabase.from("extra_orders").update({ status }).eq("id", orderId);
  if (error) {
    console.error("[setExtraOrderStatusAction] Supabase error:", error);
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/logistica");
}
