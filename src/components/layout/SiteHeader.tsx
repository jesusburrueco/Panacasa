import { createClient } from "@/lib/supabase/server";
import { Header } from "./Header";
import { AppHeader } from "./AppHeader";

/**
 * Header condicional: publico (logo + Sign In/Join Now) si no hay sesion,
 * o el header de usuario logueado (carrito, notificaciones, avatar) si la hay.
 * Se resuelve en el servidor para que no haya parpadeo del header equivocado.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? <AppHeader /> : <Header />;
}
