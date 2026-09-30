import type { AlbaranZoneGroup } from "./types";

/**
 * Genera el texto plano de resumen de ruta para un repartidor:
 *
 * RUTA 06/10/2026 - Juan
 * CARABANCHEL · Total: 12 barras (5 clientes)
 *
 * Urb. Montepinar, Portal 1, 2o (4)
 * - Ana Garcia: 2x Baguette, 2x Picado Andaluz
 */
export function buildRouteMessage({
  dateEs,
  workerName,
  zone,
}: {
  dateEs: string;
  workerName: string;
  zone: AlbaranZoneGroup;
}): string {
  const lines: string[] = [];
  lines.push(`RUTA ${dateEs} - ${workerName}`);
  lines.push(
    `${zone.zoneName.toUpperCase()} · Total: ${zone.totalBarras} barras (${zone.totalClientes} ${
      zone.totalClientes === 1 ? "cliente" : "clientes"
    })`
  );

  for (const group of zone.addresses) {
    lines.push("");
    lines.push(`${group.address} (${group.totalBarras})`);
    for (const customer of group.customers) {
      const items = customer.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ");
      lines.push(`- ${customer.customerName}: ${items || "sin panes"}`);
    }
  }

  return lines.join("\n");
}

/** Construye un enlace wa.me con el mensaje precargado (sin enviarlo). */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
