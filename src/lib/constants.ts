export const CONTACT = {
  phone: "+34600000000",
  email: "info@panacasa.com",
  whatsapp: "34600000000",
  address: "Madrid, España",
};

/** Numero de telefono legible: "+34 600 000 000". */
export const CONTACT_PHONE_DISPLAY = CONTACT.phone.replace(
  /^(\+\d{2})(\d{3})(\d{3})(\d{3})$/,
  "$1 $2 $3 $4"
);

export function contactMailto(subject?: string): string {
  return subject
    ? `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${CONTACT.email}`;
}

export function contactTel(): string {
  return `tel:${CONTACT.phone}`;
}

export function contactWhatsapp(message?: string): string {
  return message
    ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${CONTACT.whatsapp}`;
}

/** Limite de barras diarias de los planes estandar; por encima, plan a medida. */
export const MAX_BREADS_PER_DAY = 3;

export const DAYS_OF_WEEK = [
  { value: "lunes", label: "Lunes", short: "L" },
  { value: "martes", label: "Martes", short: "M" },
  { value: "miercoles", label: "Miércoles", short: "X" },
  { value: "jueves", label: "Jueves", short: "J" },
  { value: "viernes", label: "Viernes", short: "V" },
  { value: "sabado", label: "Sábado", short: "S" },
  { value: "domingo", label: "Domingo", short: "D" },
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]["value"];

export const WEEKDAYS: DayOfWeek[] = ["lunes", "martes", "miercoles", "jueves", "viernes"];
export const ALL_DAYS: DayOfWeek[] = DAYS_OF_WEEK.map((day) => day.value);

/** Ordena los dias segun la semana y descarta valores desconocidos. */
export function sortDays(days: readonly string[]): DayOfWeek[] {
  return ALL_DAYS.filter((day) => days?.includes(day));
}

/** "Lunes a viernes", "Todos los días" o "Lunes, Miércoles, Viernes". */
export function formatDeliveryDays(days: readonly string[]): string {
  const sorted = sortDays(days);
  if (sorted.length === 0) return "Sin días asignados";
  if (sorted.length === ALL_DAYS.length) return "Todos los días";
  if (sorted.length === WEEKDAYS.length && WEEKDAYS.every((d) => sorted.includes(d))) {
    return "Lunes a viernes";
  }
  return sorted
    .map((value) => DAYS_OF_WEEK.find((day) => day.value === value)?.label ?? value)
    .join(", ");
}
