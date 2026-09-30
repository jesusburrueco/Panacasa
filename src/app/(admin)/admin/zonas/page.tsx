import { createClient } from "@/lib/supabase/server";
import { ZonasManager } from "./ZonasManager";

export default async function ZonasPage() {
  const supabase = await createClient();
  // Zonas (barrios) y puntos de entrega (urbanizaciones) colocados en el mapa.
  // Las direcciones de los clientes se muestran como referencia por zona. La
  // tabla pickup_points ya no se usa (solo reparto a domicilio).
  const [{ data: zones }, { data: points }, { data: customers }] = await Promise.all([
    supabase.from("delivery_zones").select("*").order("name"),
    supabase.from("delivery_points").select("*").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, address, delivery_zone_id")
      .not("delivery_zone_id", "is", null),
  ]);

  return <ZonasManager zones={zones ?? []} points={points ?? []} customers={customers ?? []} />;
}
