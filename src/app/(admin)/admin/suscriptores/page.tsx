import { Suspense } from "react";
import Link from "next/link";
import { SubscriberFilters } from "@/components/admin/SubscriberFilters";
import { getSubscriberDirectory } from "@/lib/supabase/subscriber-directory";
import { createClient } from "@/lib/supabase/server";

const statusClasses: Record<string, { chip: string; dot: string; label: string }> = {
  active: { chip: "bg-green-100 text-green-800", dot: "bg-green-600", label: "Activo" },
  paused: { chip: "bg-orange-100 text-orange-800", dot: "bg-orange-600", label: "Pausado" },
  cancelled: { chip: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: "Cancelado" },
  past_due: { chip: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Pago pendiente" },
};

export default async function SuscriptoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; plan?: string }>;
}) {
  const { q, estado, plan } = await searchParams;

  // DEBUG temporal: query plana pedida para diagnosticar por que no
  // aparecen suscriptores pese a haber filas en subscriptions. Quitar en
  // cuanto se identifique la causa.
  const debugSupabase = await createClient();
  const { data: debugData, error: debugError } = await debugSupabase
    .from("subscriptions")
    .select("*, profiles(*), subscription_plans(*)");
  console.log("[SuscriptoresPage debug] data:", JSON.stringify(debugData, null, 2));
  console.log("[SuscriptoresPage debug] error:", debugError);

  const allSubscribers = await getSubscriberDirectory();

  let subscribers = allSubscribers;

  if (q) {
    const query = q.toLowerCase();
    subscribers = subscribers.filter(
      (subscriber) =>
        subscriber.fullName?.toLowerCase().includes(query) ||
        subscriber.email?.toLowerCase().includes(query)
    );
  }
  if (estado && estado !== "todos") {
    subscribers = subscribers.filter(
      (subscriber) => subscriber.currentSubscription?.status === estado
    );
  }
  if (plan && plan !== "todos") {
    subscribers = subscribers.filter(
      (subscriber) => subscriber.currentSubscription?.frequency === plan
    );
  }

  return (
    <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-serif text-display-lg-mobile text-primary md:text-display-lg">
          Gestión de Suscriptores
        </h1>
      </div>

      <Suspense fallback={<div className="mb-8 h-[92px] rounded-lg bg-surface-container-lowest" />}>
        <SubscriberFilters />
      </Suspense>

      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Suscriptor
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">Plan</th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Estado
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Próxima entrega
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Método de entrega
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Miembro desde
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {subscribers.map((subscriber) => {
                const status = subscriber.currentSubscription
                  ? statusClasses[subscriber.currentSubscription.status]
                  : null;
                return (
                  <tr
                    key={subscriber.id}
                    className="transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/suscriptores/${subscriber.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-on-surface">
                            {subscriber.fullName ?? "Sin nombre"}
                          </p>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            {subscriber.email ?? "—"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      {subscriber.currentSubscription?.planName ? (
                        <span className="rounded-full border border-outline-variant bg-surface-container-highest px-3 py-1 font-sans text-label-sm font-medium capitalize text-tertiary">
                          {subscriber.currentSubscription.planName}
                        </span>
                      ) : (
                        <span className="font-sans text-label-sm text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {status ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-label-sm font-semibold ${status.chip}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      ) : (
                        <span className="font-sans text-label-sm text-on-surface-variant">
                          Sin suscripción
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {subscriber.currentSubscription?.nextDeliveryDate
                        ? new Date(
                            subscriber.currentSubscription.nextDeliveryDate
                          ).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {subscriber.address ?? "—"}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {new Date(subscriber.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/suscriptores/${subscriber.id}`}
                        aria-label={`Ver detalle de ${subscriber.fullName ?? "suscriptor"}`}
                        className="text-outline transition-colors hover:text-primary"
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {subscribers.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center font-sans text-body-md text-on-surface-variant"
                  >
                    No se encontraron suscriptores con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-6 py-4">
          <span className="font-sans text-label-sm text-on-surface-variant">
            Mostrando {subscribers.length} de {allSubscribers.length} suscriptores
          </span>
        </div>
      </div>
    </main>
  );
}
