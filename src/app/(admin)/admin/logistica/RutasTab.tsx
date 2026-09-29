"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  createDeliveryRouteAction,
  deleteDeliveryRouteAction,
  setDeliveryRouteStatusAction,
  updateDeliveryRouteAction,
  type DeliveryRouteActionState,
} from "@/lib/supabase/delivery-route-actions";
import type { RouteWithJoins } from "./types";

type DeliveryZone = Tables<"delivery_zones">;
type DeliveryWorker = Tables<"delivery_workers">;

const initialState: DeliveryRouteActionState = { error: null };

const STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: "pending", label: "Pendiente", className: "bg-orange-100 text-orange-800" },
  { value: "in_progress", label: "En curso", className: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Completada", className: "bg-green-100 text-green-800" },
];

export function RutasTab({
  date,
  routes,
  zones,
  workers,
}: {
  date: string;
  routes: RouteWithJoins[];
  zones: DeliveryZone[];
  workers: DeliveryWorker[];
}) {
  const router = useRouter();
  const [modalRoute, setModalRoute] = useState<RouteWithJoins | null | undefined>(undefined);
  const [isChangingStatus, startChangingStatus] = useTransition();

  function handleDateChange(newDate: string) {
    router.push(`/admin/logistica?fecha=${newDate}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Fecha de las rutas</span>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="mt-1 block rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => setModalRoute(null)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined">add_road</span>
          Crear Ruta
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">Ruta</th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">Zona</th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">
                  Repartidor
                </th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">Estado</th>
                <th className="px-6 py-4 font-sans text-label-md text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {routes.map((route) => {
                const status = STATUS_OPTIONS.find((option) => option.value === route.status);
                return (
                  <tr key={route.id} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface">{route.name}</td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {route.delivery_zones?.name ?? "—"}
                    </td>
                    <td className="px-6 py-5 font-sans text-body-md text-on-surface-variant">
                      {route.delivery_workers?.name ?? "Sin asignar"}
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={route.status}
                        disabled={isChangingStatus}
                        onChange={(e) =>
                          startChangingStatus(() => {
                            setDeliveryRouteStatusAction(route.id, e.target.value);
                          })
                        }
                        className={cn(
                          "rounded-full border-0 px-3 py-1.5 font-sans text-label-sm font-semibold focus:ring-2 focus:ring-primary",
                          status?.className ?? "bg-surface-variant text-on-surface-variant"
                        )}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => setModalRoute(route)}
                        aria-label={`Editar ${route.name}`}
                        className="text-outline transition-colors hover:text-primary"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {routes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center font-sans text-body-md text-on-surface-variant"
                  >
                    No hay rutas creadas para esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalRoute !== undefined && (
        <RouteModal
          route={modalRoute}
          zones={zones}
          workers={workers}
          defaultDate={date}
          onClose={() => setModalRoute(undefined)}
        />
      )}
    </div>
  );
}

function RouteModal({
  route,
  zones,
  workers,
  defaultDate,
  onClose,
}: {
  route: RouteWithJoins | null;
  zones: DeliveryZone[];
  workers: DeliveryWorker[];
  defaultDate: string;
  onClose: () => void;
}) {
  const action = route ? updateDeliveryRouteAction.bind(null, route.id) : createDeliveryRouteAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, onClose]);

  const handleDelete = () => {
    if (!route) return;
    if (!confirm(`¿Eliminar la ruta "${route.name}"?`)) return;
    startDelete(async () => {
      await deleteDeliveryRouteAction(route.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-serif text-headline-sm text-primary">
            {route ? "Editar Ruta" : "Crear Ruta de Reparto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form action={formAction} className="space-y-4 p-6">
          {state.error && (
            <p
              role="alert"
              className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
            >
              {state.error}
            </p>
          )}
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Nombre de la ruta</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Ruta Centro Madrid"
              defaultValue={route?.name}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Fecha de reparto</span>
            <input
              name="deliveryDate"
              type="date"
              required
              defaultValue={route?.delivery_date ?? defaultDate}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Zona asignada</span>
            <select
              name="zoneId"
              defaultValue={route?.zone_id ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin zona asignada</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Repartidor asignado</span>
            <select
              name="workerId"
              defaultValue={route?.worker_id ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin repartidor asignado</option>
              {workers
                .filter((worker) => worker.is_active)
                .map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Notas</span>
            <textarea
              name="notes"
              rows={2}
              defaultValue={route?.notes ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            {route ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-sans text-label-md text-error hover:underline"
              >
                {isDeleting ? "Eliminando..." : "Eliminar ruta"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary px-8 py-3 font-sans text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95"
              >
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
