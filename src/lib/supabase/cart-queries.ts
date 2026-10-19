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
