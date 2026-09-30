import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { getAlbaranData } from "@/lib/supabase/logistics-queries";
import { todayIsoMadrid } from "@/lib/logistics/types";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: activeSubscribers },
    { count: totalSubscriptions },
    { count: cancelledSubscriptions },
    { totalClientes: deliveriesToday },
    { data: activePlans },
    { data: recentSubscriptions },
    { data: growthRows },
    { data: itemRows },
  ] = await Promise.all([
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    // Mismo calculo en vivo que el albaran de /admin/logistica.
    getAlbaranData(todayIsoMadrid()),
    supabase
      .from("subscriptions")
      .select("subscription_plans(price_cents)")
      .eq("status", "active"),
    supabase
      .from("subscriptions")
      .select("id, created_at, status, profiles(full_name), subscription_plans(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("subscriptions").select("created_at"),
    supabase.from("subscription_items").select("quantity, products(id, name, image_url)"),
  ]);

  const mrrCents = (activePlans ?? []).reduce(
    (sum, row) => sum + (row.subscription_plans?.price_cents ?? 0),
    0
  );

  const cancellationRate =
    totalSubscriptions && totalSubscriptions > 0
      ? ((cancelledSubscriptions ?? 0) / totalSubscriptions) * 100
      : 0;

  const metrics = [
    { icon: "group", label: "Suscriptores Activos", value: String(activeSubscribers ?? 0) },
    { icon: "payments", label: "MRR Mensual", value: formatPrice(mrrCents) },
    {
      icon: "trending_down",
      label: "Tasa de Cancelación",
      value: `${cancellationRate.toFixed(1)}%`,
    },
    { icon: "local_shipping", label: "Entregas Hoy", value: String(deliveriesToday) },
  ];

  // Crecimiento de suscriptores: agrupamos por mes los ultimos 6 meses.
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { year: date.getFullYear(), month: date.getMonth(), label: MONTH_LABELS[date.getMonth()] };
  });
  const monthCounts = months.map(
    ({ year, month }) =>
      (growthRows ?? []).filter((row) => {
        const created = new Date(row.created_at);
        return created.getFullYear() === year && created.getMonth() === month;
      }).length
  );
  const maxCount = Math.max(1, ...monthCounts);
  const chartData = months.map((m, index) => ({
    month: m.label,
    value: monthCounts[index],
    height: Math.round((monthCounts[index] / maxCount) * 100),
  }));

  // Productos mas elegidos, sumando las cantidades de todas las suscripciones.
  const productTotals = new Map<string, { name: string; imageUrl: string | null; total: number }>();
  (itemRows ?? []).forEach((row) => {
    const product = row.products;
    if (!product) return;
    const current = productTotals.get(product.id) ?? {
      name: product.name,
      imageUrl: product.image_url,
      total: 0,
    };
    current.total += row.quantity;
    productTotals.set(product.id, current);
  });
  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return (
    <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
      <div className="mb-10">
        <h1 className="mb-2 font-serif text-display-lg-mobile text-on-surface md:text-display-lg">
          Panel de Control
        </h1>
        <p className="font-sans text-body-lg text-on-surface-variant">
          Buenos días, revisa el rendimiento de tus entregas de pan artesanal hoy.
        </p>
      </div>

      {/* Metricas */}
      <div className="mb-section-gap grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="cursor-default rounded-lg border border-surface-variant/30 bg-surface-container-lowest p-6 shadow-soft transition-all hover:scale-[1.02]"
          >
            <span className="mb-4 inline-flex rounded-lg bg-surface-container p-2 text-primary">
              <span className="material-symbols-outlined">{metric.icon}</span>
            </span>
            <p className="mb-1 font-sans text-label-md uppercase tracking-wider text-on-surface-variant">
              {metric.label}
            </p>
            <p className="font-serif text-headline-sm text-on-surface">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Grafico y suscripciones recientes */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-lg border border-surface-variant/30 bg-surface-container-lowest p-8 shadow-soft lg:col-span-2">
          <h2 className="mb-8 font-serif text-headline-sm text-on-surface">
            Crecimiento de Suscriptores
          </h2>
          <div className="flex h-56 items-end justify-between gap-2 px-2">
            {chartData.map((bar, index) => {
              const isLast = index === chartData.length - 1;
              return (
                <div
                  key={bar.month}
                  className="group relative w-[12%]"
                  style={{ height: `${Math.max(bar.height, 4)}%` }}
                >
                  <div
                    className={
                      isLast
                        ? "h-full w-full rounded-t-lg bg-primary transition-all hover:bg-primary-container"
                        : "h-full w-full rounded-t-lg bg-primary/40 transition-all group-hover:bg-primary/60"
                    }
                  />
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-on-surface px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {bar.value}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between px-2 font-sans text-[12px] font-medium text-on-surface-variant">
            {chartData.map((bar) => (
              <span key={bar.month}>{bar.month}</span>
            ))}
          </div>
        </div>

        <div className="flex max-h-[500px] flex-col rounded-lg border border-surface-variant/30 bg-surface-container-lowest p-8 shadow-soft">
          <h2 className="mb-6 font-serif text-headline-sm text-on-surface">
            Suscripciones Recientes
          </h2>
          {recentSubscriptions && recentSubscriptions.length > 0 ? (
            <div className="space-y-6 overflow-y-auto pr-2">
              {recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-4 border-b border-surface-variant/20 pb-4 last:border-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed">
                    <span className="material-symbols-outlined text-on-tertiary-fixed">
                      person_add
                    </span>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-bold text-on-surface">
                      {sub.profiles?.full_name ?? "Suscriptor"}
                    </p>
                    <p className="font-sans text-xs text-on-surface-variant">
                      Plan {sub.subscription_plans?.name ?? "—"} &middot; {sub.status}
                    </p>
                    <p className="mt-1 font-sans text-[10px] font-bold uppercase text-primary opacity-60">
                      {new Date(sub.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-body-md text-on-surface-variant">
              Todavía no hay suscripciones.
            </p>
          )}
        </div>
      </div>

      {/* Productos mas elegidos */}
      <div className="mt-section-gap">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-serif text-headline-md text-on-surface">Panes Más Elegidos</h2>
          <Link
            href="/admin/catalogo"
            className="flex items-center gap-2 font-bold text-primary transition-transform hover:scale-105"
          >
            Gestionar Catálogo
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        {topProducts.length === 0 ? (
          <p className="font-sans text-body-md text-on-surface-variant">
            Todavía no hay panes elegidos en ninguna suscripción.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {topProducts.map((product) => (
              <div
                key={product.name}
                className="flex flex-col items-center rounded-lg bg-surface-container p-4 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-surface-container-highest bg-surface-container-high">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <h3 className="mb-3 font-serif text-headline-sm text-primary">{product.name}</h3>
                <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold text-on-tertiary-container">
                  {product.total} panes elegidos
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
