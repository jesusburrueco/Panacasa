import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCartLines } from "@/lib/supabase/cart-queries";
import { CartProvider } from "./CartProvider";

/** Carga el carrito del usuario en el servidor y lo expone a toda la zona. */
export async function CartRoot({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const lines = user ? await getCartLines(user.id) : [];

  return (
    <CartProvider initialLines={lines} isAuthenticated={Boolean(user)}>
      {children}
    </CartProvider>
  );
}
