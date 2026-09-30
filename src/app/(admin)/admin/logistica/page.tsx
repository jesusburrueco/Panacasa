import { createClient } from "@/lib/supabase/server";
import { getAlbaranData, getWeeklySummary } from "@/lib/supabase/logistics-queries";
import { todayIsoMadrid } from "@/lib/logistics/types";
import { LogisticaManager } from "./LogisticaManager";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function LogisticaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const date = fecha && ISO_DATE.test(fecha) ? fecha : todayIsoMadrid();

  const supabase = await createClient();
  // El albaran no se guarda: se recalcula en cada visita con las
  // suscripciones activas y los dias de entrega de cada perfil.
  const [{ data: zones }, { data: workers }, { data: routes }, albaran, weekly] = await Promise.all([
    supabase.from("delivery_zones").select("*").order("name"),
    supabase.from("delivery_workers").select("*").order("name"),
    supabase
      .from("delivery_routes")
      .select("*, delivery_workers ( name, phone, email ), delivery_zones ( name )")
      .eq("delivery_date", date)
      .order("created_at"),
    getAlbaranData(date),
    getWeeklySummary(),
  ]);

  return (
    <LogisticaManager
      date={date}
      zones={zones ?? []}
      workers={workers ?? []}
      routes={routes ?? []}
      albaran={albaran}
      weekly={weekly}
    />
  );
}
