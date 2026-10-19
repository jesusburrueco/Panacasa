import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPrice } from "@/lib/utils";
import { formatDateEs, todayIsoMadrid, weekdayNameEs } from "@/lib/logistics/types";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { setExtraOrderStatusAction } from "@/lib/supabase/extra-order-actions";

const FILTERS = [
  { value: "pending", label: "Pendientes" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "todos", label: "Todos" },
] as const;

const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-tertiary-container text-on-tertiary-container" },
  delivered: { label: "Entregado", className: "bg-primary text-on-primary" },
  cancelled: {
    label: "Cancelado",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
};

function weekdayLabel(dateIso: string) {
  const name = weekdayNameEs(dateIso);
  return DAYS_OF_WEEK.find((day) => day.value === name)?.label ?? name;
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filter = FILTERS.some((f) => f.value === estado) ? estado! : "pending";
  const today = todayIsoMadrid();

  const supabase = await createClient();
  let query = supabase
    .from("extra_orders")
    .select(
      "id, status, total_cents, delivery_date, created_at, profiles ( id, full_name, address, delivery_zones ( name ) ), extra_order_items ( id, quantity, price_cents, products ( name ) )"
    )
    .order("delivery_date", { ascending: filter === "pending" })
    .order("created_at", { ascending: true });
  if (filter !== "todos") query = query.eq("status", filter);
  const { data: orders, error } = await query;

  const groups = new Map<string, NonNullable<typeof orders>>();
  for (const order of orders ?? []) {
    const list = groups.get(order.delivery_date) ?? [];
    list.push(order);
    groups.set(order.delivery_date, list);
  }

  return (
    <main className="flex-1 px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-10">
        <h1 className="mb-2 font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Pedidos extra
        </h1>
        <p className="max-w-2xl font-sans text-body-lg text-on-surface-variant">
          Productos sueltos que los clientes añaden desde el carrito. Viajan con su entrega y se
          incluyen automáticamente en el albarán del día.
        </p>
      </div>

      <nav className="mb-8 flex gap-2 overflow-x-auto rounded-full bg-surface-container-high p-1 sm:inline-flex">
        {FILTERS.map((item) => (
          <Link
            key={item.value}
            href={item.value === "pending" ? "/admin/pedidos" : `/admin/pedidos?estado=${item.value}`}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 font-sans text-label-md transition-colors",
              filter === item.value
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="rounded-lg bg-error-container px-6 py-4 font-sans text-body-md text-on-error-container">
          No se pudieron cargar los pedidos extra.
        </p>
      ) : groups.size === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-12 text-center shadow-soft">
          <span className="material-symbols-outlined mb-4 text-5xl text-outline">
            shopping_basket
          </span>
          <p className="font-sans text-body-lg text-on-surface-variant">
            No hay pedidos extra en esta vista.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(groups.entries()).map(([date, dayOrders]) => {
            const units = dayOrders.reduce(
              (sum, order) => sum + order.extra_order_items.reduce((s, i) => s + i.quantity, 0),
              0
            );
            return (
              <section key={date}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="font-serif text-headline-sm text-primary">
                    {weekdayLabel(date)} {formatDateEs(date)}
                    {date === today && (
                      <span className="ml-3 rounded-full bg-primary-fixed px-3 py-0.5 align-middle font-sans text-label-sm text-primary">
                        Hoy
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="font-sans text-label-md text-on-surface-variant">
                      {dayOrders.length} {dayOrders.length === 1 ? "pedido" : "pedidos"} · {units}{" "}
                      uds.
                    </span>
                    <Link
                      href={`/admin/logistica?fecha=${date}`}
                      className="flex items-center gap-1 font-sans text-label-md text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      Ver albarán
                    </Link>
                  </div>
                </div>

                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {dayOrders.map((order) => {
                    const badge = statusBadge[order.status];
                    return (
                      <li
                        key={order.id}
                        className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-6 shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            {order.profiles ? (
                              <Link
                                href={`/admin/suscriptores/${order.profiles.id}`}
                                className="font-serif text-body-lg text-primary hover:underline"
                              >
                                {order.profiles.full_name ?? "Cliente"}
                              </Link>
                            ) : (
                              <p className="font-serif text-body-lg text-primary">Cliente</p>
                            )}
                            <p className="truncate font-sans text-label-sm text-on-surface-variant">
                              {[order.profiles?.address, order.profiles?.delivery_zones?.name]
                                .filter(Boolean)
                                .join(" · ") || "Sin dirección"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-3 py-1 font-sans text-label-sm uppercase tracking-widest",
                              badge?.className
                            )}
                          >
                            {badge?.label ?? order.status}
                          </span>
                        </div>

                        <ul className="space-y-1 border-y border-outline-variant/50 py-3">
                          {order.extra_order_items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between gap-4 font-sans text-body-md"
                            >
                              <span>
                                {item.quantity} × {item.products?.name ?? "Producto"}
                              </span>
                              <span className="text-on-surface-variant">
                                {formatPrice(item.price_cents * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-serif text-headline-sm text-on-surface">
                            {formatPrice(order.total_cents)}
                          </span>
                          {order.status === "pending" && (
                            <div className="flex gap-2">
                              <form
                                action={setExtraOrderStatusAction.bind(null, order.id, "cancelled")}
                              >
                                <button
                                  type="submit"
                                  className="rounded-full px-4 py-2 font-sans text-label-md text-error transition-colors hover:bg-error-container"
                                >
                                  Cancelar
                                </button>
                              </form>
                              <form
                                action={setExtraOrderStatusAction.bind(null, order.id, "delivered")}
                              >
                                <button
                                  type="submit"
                                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-sans text-label-md text-on-primary shadow-soft transition-all hover:brightness-110 active:scale-95"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    check
                                  </span>
                                  Entregado
                                </button>
                              </form>
                            </div>
                          )}
                          {order.status !== "pending" && (
                            <form action={setExtraOrderStatusAction.bind(null, order.id, "pending")}>
                              <button
                                type="submit"
                                className="rounded-full px-4 py-2 font-sans text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant"
                              >
                                Volver a pendiente
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
