import { createClient } from "@/lib/supabase/server";
import { getAlbaranData } from "@/lib/supabase/logistics-queries";
import { LogisticaManager } from "./LogisticaManager";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function LogisticaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const date = fecha || todayIso();

  const supabase = await createClient();
  const [{ data: zones }, { data: workers }, { data: routes }, albaran] = await Promise.all([
    supabase.from("delivery_zones").select("*").order("name"),
    supabase.from("delivery_workers").select("*").order("name"),
    supabase
      .from("delivery_routes")
      .select("*, delivery_workers ( name, phone, email ), delivery_zones ( name )")
      .eq("delivery_date", date)
      .order("created_at"),
    getAlbaranData(date),
  ]);

  return (
    <LogisticaManager
      date={date}
      zones={zones ?? []}
      workers={workers ?? []}
      routes={routes ?? []}
      albaran={albaran}
    />
  );
}
