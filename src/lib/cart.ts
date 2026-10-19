/** Linea del carrito tal y como la consume la UI (producto ya resuelto). */
export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string | null;
}

export function cartSubtotalCents(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
}

export function cartUnits(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
