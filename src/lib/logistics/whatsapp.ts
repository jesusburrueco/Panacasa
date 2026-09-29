import type { AlbaranZoneGroup } from "./types";

/**
 * Genera el texto plano de resumen de ruta para un repartidor, con el
 * mismo formato solicitado:
 *
 * RUTA 20/09/2026 - Juan
 * Total: 72 barras
 * URB. MONTEPINAR:
 * P1-1o: 4x Picado Andaluz
 * P1-2o: 4x Baguette
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
  lines.push(`Total: ${zone.totalBarras} barras`);
  lines.push(`URB. ${zone.zoneName.toUpperCase()}:`);

  for (const delivery of zone.deliveries) {
    const label = [delivery.portal, delivery.floor].filter(Boolean).join("-") || delivery.customerName;
    for (const item of delivery.items) {
      lines.push(`${label}: ${item.quantity}x ${item.productName}`);
    }
    if (delivery.observaciones) {
      lines.push(`  (${delivery.observaciones})`);
    }
  }

  return lines.join("\n");
}

/** Construye un enlace wa.me con el mensaje precargado (sin enviarlo). */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
