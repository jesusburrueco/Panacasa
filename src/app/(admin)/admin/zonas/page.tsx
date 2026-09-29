import { createClient } from "@/lib/supabase/server";
import { ZonasManager } from "./ZonasManager";

export default async function ZonasPage() {
  const supabase = await createClient();
  const [{ data: zones }, { data: pickupPoints }] = await Promise.all([
    supabase.from("delivery_zones").select("*").order("name"),
    supabase.from("pickup_points").select("*").order("name"),
  ]);

  return <ZonasManager zones={zones ?? []} pickupPoints={pickupPoints ?? []} />;
}
