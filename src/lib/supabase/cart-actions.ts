"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCartLines } from "@/lib/supabase/cart-queries";
import { nextOrderDeliveryDate } from "@/lib/logistics/types";
import { cartSubtotalCents, type CartLine } from "@/lib/cart";

export interface CartActionResult {
  error: string | null;
  /** Carrito actualizado (el cliente lo usa para reconciliar su estado). */
  lines: CartLine[];
}

export interface ConfirmExtraOrderResult extends CartActionResult {
  deliveryDate: string | null;
}

const MAX_QUANTITY = 20;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const notLoggedIn: CartActionResult = {
  error: "Inicia sesión para usar el carrito.",
  lines: [],
};

/** Fija la cantidad de un producto en el carrito (0 lo elimina). */
export async function setCartQuantityAction(
  productId: string,
  quantity: number
): Promise<CartActionResult> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return notLoggedIn;

  const nextQuantity = Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));

  const { error } =
    nextQuantity === 0
      ? await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId)
      : await supabase
          .from("cart_items")
          .upsert(
            { user_id: userId, product_id: productId, quantity: nextQuantity },
            { onConflict: "user_id,product_id" }
          );

  if (error) {
    console.error("[setCartQuantityAction] Supabase error:", error);
    return { error: "No se pudo actualizar el carrito.", lines: await getCartLines(userId) };
  }

  return { error: null, lines: await getCartLines(userId) };
}

/**
 * Convierte el carrito en un pedido extra para la proxima entrega del
 * cliente. Los precios se toman de la base de datos, no del cliente.
 */
export async function confirmExtraOrderAction(): Promise<ConfirmExtraOrderResult> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { ...notLoggedIn, deliveryDate: null };

  const [lines, { data: profile }, { data: subscription }] = await Promise.all([
    getCartLines(userId),
    supabase.from("profiles").select("delivery_days").eq("id", userId).single(),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  const fail = (error: string): ConfirmExtraOrderResult => ({ error, lines, deliveryDate: null });

  if (lines.length === 0) return fail("Tu carrito está vacío.");
  if (!subscription) {
    return fail("Necesitas una suscripción activa: los pedidos extra viajan con tu entrega.");
  }

  const deliveryDate = nextOrderDeliveryDate(profile?.delivery_days ?? []);
  if (!deliveryDate) {
    return fail("Elige tus días de entrega en tu perfil para programar el pedido.");
  }

  const { data: order, error: orderError } = await supabase
    .from("extra_orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_cents: cartSubtotalCents(lines),
      delivery_date: deliveryDate,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[confirmExtraOrderAction] Supabase error:", orderError);
    return fail("No se pudo crear el pedido. Inténtalo de nuevo.");
  }

  const { error: itemsError } = await supabase.from("extra_order_items").insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      quantity: line.quantity,
      price_cents: line.priceCents,
    }))
  );

  if (itemsError) {
    console.error("[confirmExtraOrderAction] Supabase error:", itemsError);
    await supabase.from("extra_orders").delete().eq("id", order.id);
    return fail("No se pudieron guardar los productos del pedido. Inténtalo de nuevo.");
  }

  await supabase.from("cart_items").delete().eq("user_id", userId);

  revalidatePath("/perfil");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/logistica");
  return { error: null, lines: [], deliveryDate };
}
