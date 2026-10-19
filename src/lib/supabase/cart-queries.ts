import { createClient } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/cart";

/** Carrito del usuario con los datos del producto. Productos inactivos fuera. */
export async function getCartLines(userId: string): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, products ( name, slug, price_cents, image_url, is_active )")
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("[getCartLines] Supabase error:", error);
    return [];
  }

  return (data ?? []).flatMap((row) =>
    row.products?.is_active
      ? [
          {
            productId: row.product_id,
            quantity: row.quantity,
            name: row.products.name,
            slug: row.products.slug,
            priceCents: row.products.price_cents,
            imageUrl: row.products.image_url,
          },
        ]
      : []
  );
}

export interface PendingExtraOrder {
  id: string;
  deliveryDate: string;
  totalCents: number;
  items: {
    id: string;
    quantity: number;
    priceCents: number;
    name: string;
    slug: string | null;
    imageUrl: string | null;
  }[];
}

/** Pedidos extra pendientes del usuario con entrega de hoy en adelante. */
export async function getPendingExtraOrders(
  userId: string,
  fromDate: string
): Promise<PendingExtraOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extra_orders")
    .select(
      "id, delivery_date, total_cents, extra_order_items ( id, quantity, price_cents, products ( name, slug, image_url ) )"
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("delivery_date", fromDate)
    .order("delivery_date")
    .order("created_at");

  if (error) {
    console.error("[getPendingExtraOrders] Supabase error:", error);
    return [];
  }

  return (data ?? []).map((order) => ({
    id: order.id,
    deliveryDate: order.delivery_date,
    totalCents: order.total_cents,
    items: order.extra_order_items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceCents: item.price_cents,
      name: item.products?.name ?? "Producto",
      slug: item.products?.slug ?? null,
      imageUrl: item.products?.image_url ?? null,
    })),
  }));
}
