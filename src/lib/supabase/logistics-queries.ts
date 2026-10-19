import { createClient } from "@/lib/supabase/server";
import { ALL_DAYS } from "@/lib/constants";
import {
  NO_ZONE_ID,
  weekdayNameEs,
  type AlbaranAddressGroup,
  type AlbaranCustomerRow,
  type AlbaranItemLine,
  type AlbaranSummary,
  type AlbaranZoneGroup,
  type WeeklyDaySummary,
} from "@/lib/logistics/types";

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/**
 * Suscripciones activas con todo lo necesario para repartir: perfil (dias de
 * entrega, zona, direccion) y panes. Es la unica fuente de los albaranes:
 * nada se guarda, asi que una suscripcion pausada o cancelada, o un cambio de
 * dias en el perfil, se refleja la proxima vez que se consulte.
 */
async function getActiveDeliverySubscriptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      user_id,
      profiles (
        full_name, phone, address, delivery_zone_id, delivery_days,
        delivery_zones ( name )
      ),
      subscription_items ( quantity, products ( name ) )
    `
    )
    .eq("status", "active");

  if (error) {
    console.error("[getActiveDeliverySubscriptions] Supabase error:", error);
    throw new Error("No se pudieron cargar las suscripciones activas.");
  }

  return (data ?? []).map((sub) => {
    const items = sub.subscription_items.map((item) => ({
      productName: item.products?.name ?? "Pan",
      quantity: item.quantity,
    }));
    return {
      subscriptionId: sub.id,
      userId: sub.user_id,
      profile: sub.profiles,
      deliveryDays: sub.profiles?.delivery_days ?? [],
      items,
      totalUnidades: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

/** Pedidos extra (carrito) de una fecha que hay que repartir. */
async function getExtraOrdersForDate(date: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("extra_orders")
    .select(
      `
      id,
      user_id,
      profiles (
        full_name, phone, address, delivery_zone_id,
        delivery_zones ( name )
      ),
      extra_order_items ( quantity, products ( name ) )
    `
    )
    .eq("delivery_date", date)
    .neq("status", "cancelled");

  if (error) {
    console.error("[getExtraOrdersForDate] Supabase error:", error);
    throw new Error("No se pudieron cargar los pedidos extra.");
  }

  return data ?? [];
}

/**
 * Albaran de produccion y reparto de una fecha, calculado en el momento:
 * clientes activos con ese dia de la semana en `profiles.delivery_days`,
 * mas los pedidos extra con esa fecha de entrega, agrupados por zona
 * (barrio) y despues por direccion (texto de `profiles.address`, sin
 * interpretar). Un pedido extra se suma a la fila del cliente si ese dia
 * ya recibe su suscripcion.
 */
export async function getAlbaranData(date: string): Promise<AlbaranSummary> {
  const weekday = weekdayNameEs(date);
  const supabase = await createClient();

  const [subscriptions, extraOrders, { data: routes }] = await Promise.all([
    getActiveDeliverySubscriptions(),
    getExtraOrdersForDate(date),
    supabase
      .from("delivery_routes")
      .select("id, zone_id, status, delivery_workers ( name, phone, email ), delivery_zones ( name )")
      .eq("delivery_date", date),
  ]);

  const zoneMap = new Map<string, AlbaranZoneGroup & { addressMap: Map<string, AlbaranAddressGroup> }>();
  const productTotals = new Map<string, number>();
  const customerMap = new Map<string, AlbaranCustomerRow>();
  let totalBarras = 0;
  let totalClientes = 0;
  let totalExtraUnidades = 0;

  const getZone = (zoneId: string, zoneName: string) => {
    let zone = zoneMap.get(zoneId);
    if (!zone) {
      zone = {
        zoneId,
        zoneName,
        totalBarras: 0,
        totalClientes: 0,
        addresses: [],
        routes: [],
        addressMap: new Map(),
      };
      zoneMap.set(zoneId, zone);
    }
    return zone;
  };

  type DeliveryProfile = {
    full_name: string | null;
    phone: string | null;
    address: string | null;
    delivery_zone_id: string | null;
    delivery_zones: { name: string } | null;
  } | null;

  const addLines = (customerId: string, profile: DeliveryProfile, items: AlbaranItemLine[]) => {
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    const zone = getZone(
      profile?.delivery_zone_id ?? NO_ZONE_ID,
      profile?.delivery_zones?.name ?? "Sin zona asignada"
    );

    const address = profile?.address?.trim() || "Sin dirección";
    let addressGroup = zone.addressMap.get(address);
    if (!addressGroup) {
      addressGroup = { address, totalBarras: 0, customers: [] };
      zone.addressMap.set(address, addressGroup);
    }

    let customer = customerMap.get(customerId);
    if (!customer) {
      customer = {
        customerId,
        customerName: profile?.full_name ?? "Cliente",
        phone: profile?.phone ?? null,
        items: [],
        totalUnidades: 0,
      };
      customerMap.set(customerId, customer);
      addressGroup.customers.push(customer);
      zone.totalClientes += 1;
      totalClientes += 1;
    }

    customer.items.push(...items);
    customer.totalUnidades += units;
    addressGroup.totalBarras += units;
    zone.totalBarras += units;
    totalBarras += units;

    for (const item of items) {
      productTotals.set(item.productName, (productTotals.get(item.productName) ?? 0) + item.quantity);
    }
  };

  for (const sub of subscriptions) {
    if (!sub.deliveryDays.includes(weekday)) continue;
    addLines(sub.userId, sub.profile, sub.items);
  }

  for (const order of extraOrders) {
    const items = order.extra_order_items.map((item) => ({
      productName: item.products?.name ?? "Pan",
      quantity: item.quantity,
      isExtra: true,
    }));
    totalExtraUnidades += items.reduce((sum, item) => sum + item.quantity, 0);
    addLines(order.user_id, order.profiles, items);
  }

  // Las rutas solo se listan en zonas con entregas: una ruta asignada a una
  // zona sin clientes ese dia no aporta nada al albaran.
  for (const route of routes ?? []) {
    const zone = route.zone_id ? zoneMap.get(route.zone_id) : undefined;
    zone?.routes.push({
      routeId: route.id,
      workerName: route.delivery_workers?.name ?? "Sin asignar",
      workerPhone: route.delivery_workers?.phone ?? null,
      workerEmail: route.delivery_workers?.email ?? null,
      status: route.status,
    });
  }

  const zones = Array.from(zoneMap.values())
    .map(({ addressMap, ...zone }) => ({
      ...zone,
      addresses: Array.from(addressMap.values()).sort((a, b) => collator.compare(a.address, b.address)),
    }))
    // "Sin zona asignada" al final, para que salte a la vista.
    .sort((a, b) =>
      a.zoneId === NO_ZONE_ID ? 1 : b.zoneId === NO_ZONE_ID ? -1 : collator.compare(a.zoneName, b.zoneName)
    );

  const breakdownByProduct = Array.from(productTotals.entries())
    .map(([productName, quantity]) => ({ productName, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  return {
    date,
    weekday,
    totalBarras,
    totalClientes,
    totalExtraUnidades,
    breakdownByProduct,
    zones,
  };
}

/** Barras y clientes de cada dia de la semana, con las suscripciones activas de hoy. */
export async function getWeeklySummary(): Promise<WeeklyDaySummary[]> {
  const subscriptions = await getActiveDeliverySubscriptions();
  return ALL_DAYS.map((day) => {
    const forDay = subscriptions.filter((sub) => sub.deliveryDays.includes(day));
    return {
      day,
      totalBarras: forDay.reduce((sum, sub) => sum + sub.totalUnidades, 0),
      totalClientes: forDay.length,
    };
  });
}
