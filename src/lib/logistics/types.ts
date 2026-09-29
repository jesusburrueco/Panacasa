export interface AlbaranItemLine {
  productName: string;
  quantity: number;
}

export interface AlbaranDeliveryRow {
  deliveryId: string;
  customerName: string;
  portal: string;
  floor: string;
  observaciones: string;
  items: AlbaranItemLine[];
  totalUnidades: number;
}

export interface AlbaranRoute {
  routeId: string;
  workerName: string;
  workerPhone: string | null;
  workerEmail: string | null;
  status: string;
}

export interface AlbaranZoneGroup {
  zoneId: string;
  zoneName: string;
  totalBarras: number;
  deliveries: AlbaranDeliveryRow[];
  routes: AlbaranRoute[];
}

export interface AlbaranProductBreakdown {
  productName: string;
  quantity: number;
}

export interface AlbaranSummary {
  date: string;
  totalBarras: number;
  breakdownByProduct: AlbaranProductBreakdown[];
  zones: AlbaranZoneGroup[];
}

export const WEEKDAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
] as const;

export function weekdayNameEs(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  return WEEKDAYS_ES[date.getUTCDay()];
}

export function formatDateEs(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface AlbaranPortalTotal {
  portal: string;
  total: number;
}

/** Agrupa las entregas de una zona por portal, en el orden de aparicion. */
export function groupDeliveriesByPortal(deliveries: AlbaranDeliveryRow[]): AlbaranPortalTotal[] {
  const order: string[] = [];
  const totals = new Map<string, number>();
  for (const delivery of deliveries) {
    const portal = delivery.portal || "—";
    if (!totals.has(portal)) {
      order.push(portal);
      totals.set(portal, 0);
    }
    totals.set(portal, totals.get(portal)! + delivery.totalUnidades);
  }
  return order.map((portal) => ({ portal, total: totals.get(portal)! }));
}
