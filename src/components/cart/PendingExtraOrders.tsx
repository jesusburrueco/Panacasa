import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { PendingExtraOrder } from "@/lib/supabase/cart-queries";
import { CancelExtraOrderButton } from "./CancelExtraOrderButton";

function formatDeliveryDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/**
 * Pedidos extra pendientes del cliente (perfil y "Mi plan"). No renderiza
 * nada si no hay ninguno.
 */
export function PendingExtraOrders({
  orders,
  today,
  className,
}: {
  orders: PendingExtraOrder[];
  /** Fecha de hoy (Madrid): el pedido de hoy ya no se puede cancelar. */
  today: string;
  className?: string;
}) {
  if (orders.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-headline-sm text-primary">
        Pedidos extra para tu próxima entrega
      </h2>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-lg border border-tertiary/20 bg-surface-container-low p-5 shadow-soft md:p-6"
          >
            <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-sans text-label-md text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  local_shipping
                </span>
                Llega el <span className="capitalize">{formatDeliveryDate(order.deliveryDate)}</span>
              </p>
              <span className="rounded-full bg-tertiary-container px-3 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-on-tertiary-container">
                Extra
              </span>
            </header>

            <ul className="divide-y divide-outline-variant/50">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-DEFAULT bg-surface-container-highest">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined absolute inset-0 m-auto h-fit w-fit text-outline">
                        bakery_dining
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.slug ? (
                      <Link
                        href={`/catalogo/${item.slug}`}
                        className="block truncate font-sans text-label-md text-on-surface hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <p className="truncate font-sans text-label-md text-on-surface">{item.name}</p>
                    )}
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      {item.quantity} × {formatPrice(item.priceCents)}
                    </p>
                  </div>
                  <span className="font-sans text-label-md font-bold text-on-surface">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="mt-4 flex flex-col gap-4 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-baseline gap-2">
                <span className="font-sans text-label-md text-on-surface-variant">Total</span>
                <span className="font-serif text-headline-sm text-primary">
                  {formatPrice(order.totalCents)}
                </span>
              </p>
              <CancelExtraOrderButton
                orderId={order.id}
                disabled={order.deliveryDate <= today}
              />
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
