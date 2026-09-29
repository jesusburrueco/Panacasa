import { createClient } from "@/lib/supabase/server";
import { weekdayNameEs, type AlbaranSummary, type AlbaranZoneGroup } from "@/lib/logistics/types";

/**
 * Crea (si no existen ya) las entregas del dia para todas las suscripciones
 * activas cuya zona reparte ese dia de la semana. Idempotente: usa el indice
 * unico (subscription_id, scheduled_date) para no duplicar si se pulsa
 * "Generar albaran" varias veces.
 */
export async function ensureDeliveriesForDate(date: string): Promise<void> {
  const supabase = await createClient();
  const weekday = weekdayNameEs(date);

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("id, delivery_days")
    .eq("is_active", true);

  const zoneIdsForDay = new Set(
    (zones ?? []).filter((zone) => zone.delivery_days.includes(weekday)).map((zone) => zone.id)
  );

  if (zoneIdsForDay.size === 0) return;

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, profiles(delivery_zone_id, address)")
    .eq("status", "active");

  const rows = (subscriptions ?? [])
    .filter((sub) => sub.profiles?.delivery_zone_id && zoneIdsForDay.has(sub.profiles.delivery_zone_id))
    .map((sub) => ({
      subscription_id: sub.id,
      delivery_zone_id: sub.profiles!.delivery_zone_id as string,
      scheduled_date: date,
      status: "pending",
      address_detail: sub.profiles!.address ?? null,
    }));

  if (rows.length === 0) return;

  await supabase
    .from("deliveries")
    .upsert(rows, { onConflict: "subscription_id,scheduled_date", ignoreDuplicates: true });
}

/** Construye el albaran de produccion y reparto para una fecha ya generada. */
export async function getAlbaranData(date: string): Promise<AlbaranSummary> {
  const supabase = await createClient();

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      `
      id, portal, floor, address_detail, notes, status, delivery_zone_id,
      delivery_zones ( id, name ),
      subscriptions (
        id,
        profiles ( full_name ),
        subscription_items ( quantity, products ( name ) )
      )
    `
    )
    .eq("scheduled_date", date);

  const { data: routes } = await supabase
    .from("delivery_routes")
    .select("id, zone_id, status, delivery_workers ( name, phone, email ), delivery_zones ( name )")
    .eq("delivery_date", date);

  const zoneMap = new Map<string, AlbaranZoneGroup>();
  const productTotals = new Map<string, number>();
  let totalBarras = 0;

  for (const delivery of deliveries ?? []) {
    const zoneId = delivery.delivery_zone_id;
    const zoneName = delivery.delivery_zones?.name ?? "Sin zona";

    if (!zoneMap.has(zoneId)) {
      zoneMap.set(zoneId, { zoneId, zoneName, totalBarras: 0, deliveries: [], routes: [] });
    }
    const zoneGroup = zoneMap.get(zoneId)!;

    const items = (delivery.subscriptions?.subscription_items ?? []).map((item) => ({
      productName: item.products?.name ?? "Pan",
      quantity: item.quantity,
    }));
    const deliveryTotal = items.reduce((sum, item) => sum + item.quantity, 0);

    zoneGroup.deliveries.push({
      deliveryId: delivery.id,
      customerName: delivery.subscriptions?.profiles?.full_name ?? "Cliente",
      portal: delivery.portal ?? "",
      floor: delivery.floor ?? "",
      observaciones: delivery.notes ?? "",
      items,
      totalUnidades: deliveryTotal,
    });

    zoneGroup.totalBarras += deliveryTotal;
    totalBarras += deliveryTotal;

    for (const item of items) {
      productTotals.set(item.productName, (productTotals.get(item.productName) ?? 0) + item.quantity);
    }
  }

  for (const route of routes ?? []) {
    if (!route.zone_id) continue;
    if (!zoneMap.has(route.zone_id)) {
      zoneMap.set(route.zone_id, {
        zoneId: route.zone_id,
        zoneName: route.delivery_zones?.name ?? "Zona",
        totalBarras: 0,
        deliveries: [],
        routes: [],
      });
    }
    zoneMap.get(route.zone_id)!.routes.push({
      routeId: route.id,
      workerName: route.delivery_workers?.name ?? "Sin asignar",
      workerPhone: route.delivery_workers?.phone ?? null,
      workerEmail: route.delivery_workers?.email ?? null,
      status: route.status,
    });
  }

  const zonesArray = Array.from(zoneMap.values()).sort((a, b) => a.zoneName.localeCompare(b.zoneName));
  const breakdownByProduct = Array.from(productTotals.entries())
    .map(([productName, quantity]) => ({ productName, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  return { date, totalBarras, breakdownByProduct, zones: zonesArray };
}
