export interface AlbaranItemLine {
  productName: string;
  quantity: number;
}

/** Un cliente con entrega en la fecha del albaran. */
export interface AlbaranCustomerRow {
  subscriptionId: string;
  customerName: string;
  phone: string | null;
  items: AlbaranItemLine[];
  totalUnidades: number;
}

/**
 * Clientes que comparten la misma direccion (profiles.address tal cual,
 * p. ej. "Urb. Montepinar, Portal 1, 2o"). No se extrae portal/piso.
 */
export interface AlbaranAddressGroup {
  address: string;
  totalBarras: number;
  customers: AlbaranCustomerRow[];
}

export interface AlbaranRoute {
  routeId: string;
  workerName: string;
  workerPhone: string | null;
  workerEmail: string | null;
  status: string;
}

/** Zona de reparto (barrio), con sus direcciones de entrega. */
export interface AlbaranZoneGroup {
  zoneId: string;
  zoneName: string;
  totalBarras: number;
  totalClientes: number;
  addresses: AlbaranAddressGroup[];
  routes: AlbaranRoute[];
}

export interface AlbaranProductBreakdown {
  productName: string;
  quantity: number;
}

export interface AlbaranSummary {
  date: string;
  weekday: string;
  totalBarras: number;
  totalClientes: number;
  breakdownByProduct: AlbaranProductBreakdown[];
  zones: AlbaranZoneGroup[];
}

/** Barras y clientes por dia de la semana (suscripciones activas). */
export interface WeeklyDaySummary {
  day: string;
  totalBarras: number;
  totalClientes: number;
}

/** Id sintetico para agrupar a los clientes sin zona asignada en su perfil. */
export const NO_ZONE_ID = "sin-zona";

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

/** Fecha de hoy (YYYY-MM-DD) en horario de Madrid, no en UTC. */
export function todayIsoMadrid(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Proximas `count` fechas (desde hoy incluido) que caen en alguno de `days`. */
export function upcomingDeliveryDates(days: readonly string[], count: number): string[] {
  if (days.length === 0) return [];
  const today = todayIsoMadrid();
  const result: string[] = [];
  for (let offset = 0; result.length < count && offset < 7 * count; offset++) {
    const date = addDaysIso(today, offset);
    if (days.includes(weekdayNameEs(date))) result.push(date);
  }
  return result;
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
