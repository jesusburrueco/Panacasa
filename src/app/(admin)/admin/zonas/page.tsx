import { createClient } from "@/lib/supabase/server";
import { ZonasManager } from "./ZonasManager";

export default async function ZonasPage() {
  const supabase = await createClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("name");

  return <ZonasManager zones={zones ?? []} />;
}
