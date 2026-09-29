"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  createDeliveryWorkerAction,
  deleteDeliveryWorkerAction,
  toggleDeliveryWorkerActiveAction,
  updateDeliveryWorkerAction,
  type DeliveryWorkerActionState,
} from "@/lib/supabase/delivery-worker-actions";

type DeliveryWorker = Tables<"delivery_workers">;

const initialState: DeliveryWorkerActionState = { error: null };

export function RepartidoresTab({ workers }: { workers: DeliveryWorker[] }) {
  const [modalWorker, setModalWorker] = useState<DeliveryWorker | null | undefined>(undefined);
  const [isToggling, startToggle] = useTransition();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-headline-sm text-primary">
          Repartidores ({workers.length})
        </h2>
        <button
          type="button"
          onClick={() => setModalWorker(null)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined">person_add</span>
          Añadir Repartidor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="rounded-xl bg-surface-container-lowest p-5 shadow-soft transition-transform hover:-translate-y-1"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div>
                  <p className="font-sans text-label-md text-on-surface">{worker.name}</p>
                  {worker.phone && (
                    <p className="font-sans text-label-sm text-on-surface-variant">{worker.phone}</p>
                  )}
                  {worker.email && (
                    <p className="font-sans text-label-sm text-on-surface-variant">{worker.email}</p>
                  )}
                </div>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={worker.is_active}
                  disabled={isToggling}
                  onChange={() =>
                    startToggle(() => {
                      toggleDeliveryWorkerActiveAction(worker.id, !worker.is_active);
                    })
                  }
                />
                <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors peer-checked:bg-green-500" />
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalWorker(worker)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 font-sans text-label-sm text-primary hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </button>
            </div>
          </div>
        ))}
        {workers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-lowest py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">badge</span>
            <p className="font-sans text-body-md text-on-surface-variant">
              Todavía no hay repartidores dados de alta.
            </p>
          </div>
        )}
      </div>

      {modalWorker !== undefined && (
        <WorkerModal worker={modalWorker} onClose={() => setModalWorker(undefined)} />
      )}
    </div>
  );
}

function WorkerModal({
  worker,
  onClose,
}: {
  worker: DeliveryWorker | null;
  onClose: () => void;
}) {
  const action = worker
    ? updateDeliveryWorkerAction.bind(null, worker.id)
    : createDeliveryWorkerAction;
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
    if (!worker) return;
    if (!confirm(`¿Eliminar a "${worker.name}"?`)) return;
    startDelete(async () => {
      await deleteDeliveryWorkerAction(worker.id);
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
            {worker ? "Editar Repartidor" : "Añadir Repartidor"}
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
        <form action={formAction} className={cn("space-y-4 p-6")}>
          {state.error && (
            <p
              role="alert"
              className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
            >
              {state.error}
            </p>
          )}
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Nombre</span>
            <input
              name="name"
              type="text"
              required
              defaultValue={worker?.name}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Teléfono (con prefijo, ej. 34600123456)
            </span>
            <input
              name="phone"
              type="tel"
              placeholder="34600123456"
              defaultValue={worker?.phone ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={worker?.email ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex items-center gap-3">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={worker?.is_active ?? true}
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="font-sans text-label-md text-on-surface-variant">Repartidor activo</span>
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            {worker ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-sans text-label-md text-error hover:underline"
              >
                {isDeleting ? "Eliminando..." : "Eliminar repartidor"}
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
