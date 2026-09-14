"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  createDeliveryZoneAction,
  deleteDeliveryZoneAction,
  toggleDeliveryZoneActiveAction,
  updateDeliveryZoneAction,
  type DeliveryZoneActionState,
} from "@/lib/supabase/delivery-zone-actions";

type DeliveryZone = Tables<"delivery_zones">;

const initialState: DeliveryZoneActionState = { error: null };

const COVERAGE_ZONES = [
  { label: "Premium (15 min)", className: "border-orange-600 bg-orange-500/40" },
  { label: "Estándar (30 min)", className: "border-yellow-600 bg-yellow-500/40" },
  { label: "Extendido (60 min)", className: "border-blue-600 bg-blue-500/40" },
];

const MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCqScENQEGWfhARlR9LTFzgLApLnNnscGQR4HdfkyNzaKelnZ2UcmtaA6zUkrZePYV7H6EgGzVSYRgCPwEJr4bsv5vqMIpfIo_b_pgEtQg4MuXYyG0s2kKefRuk1PD8jksKNOArxla2SIpo9KHKSsSB8nT-EJTyyt6FB1QAZ8Yk--cYPWYpfIQOLlcN8CkWgaTfpxswQ_VWq4LH28OfULREmDCLGuBvw3iYWYqY00ygcqW55ZMSA3nfJ3bdGFpwhasb-QfyrBPln1E";

export function ZonasManager({ zones }: { zones: DeliveryZone[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(zones[0]?.id ?? null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [modalZone, setModalZone] = useState<DeliveryZone | null | undefined>(undefined);
  const [isToggling, startToggle] = useTransition();

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Barra de herramientas */}
      <header className="flex flex-col gap-4 border-b border-outline-variant/30 bg-surface px-margin-mobile py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-margin-desktop">
        <h2 className="font-serif text-headline-sm text-primary">Logística</h2>
        <button
          type="button"
          onClick={() => setModalZone(null)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined">add_location_alt</span>
          Añadir Zona
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de zonas */}
        <section className="flex w-full flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low lg:w-[400px]">
          <div className="flex items-end justify-between border-b border-outline-variant p-6">
            <div>
              <span className="mb-1 block font-sans text-label-sm text-on-surface-variant">
                GESTIÓN DE LOGÍSTICA
              </span>
              <h3 className="font-serif text-headline-sm text-on-surface">Zonas de reparto</h3>
            </div>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-[12px] font-bold text-on-secondary-container">
              {zones.length} Total
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedId(zone.id)}
                className={cn(
                  "group w-full cursor-pointer rounded-xl border bg-surface p-4 text-left shadow-sm transition-all hover:border-outline-variant",
                  selectedId === zone.id
                    ? "border-l-4 border-l-primary border-y-transparent border-r-transparent"
                    : "border-transparent"
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                      <span className="material-symbols-outlined">distance</span>
                    </div>
                    <div>
                      <h4 className="font-sans text-label-md text-on-surface">{zone.name}</h4>
                      <p className="font-sans text-label-sm text-on-surface-variant">
                        {zone.postal_codes.join(", ") || "Sin códigos postales"}
                      </p>
                      {zone.delivery_days.length > 0 && (
                        <p className="font-sans text-label-sm capitalize text-on-surface-variant">
                          {zone.delivery_days.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <label
                    className="relative inline-flex shrink-0 cursor-pointer items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={zone.is_active}
                      disabled={isToggling}
                      onChange={() =>
                        startToggle(() => {
                          toggleDeliveryZoneActiveAction(zone.id, !zone.is_active);
                        })
                      }
                    />
                    <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors peer-checked:bg-green-500" />
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>
                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalZone(zone);
                    }}
                    aria-label={`Editar ${zone.name}`}
                    className="rounded-full p-2 text-outline hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </div>
            ))}
            {zones.length === 0 && (
              <p className="p-4 text-center font-sans text-body-md text-on-surface-variant">
                Todavía no hay zonas de reparto configuradas.
              </p>
            )}
          </div>
        </section>

        {/* Mapa (representacion estilizada, decorativa) */}
        <section className="relative hidden flex-1 overflow-hidden lg:block">
          <Image src={MAP_IMAGE} alt="Mapa de zonas de reparto" fill className="object-cover" />
          <div className="absolute inset-0 bg-background/50" />

          <div className="absolute right-6 top-6 flex flex-col gap-2">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-surface shadow-lg transition-colors hover:bg-surface-variant">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-on-surface shadow-lg transition-colors hover:bg-surface-variant">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform hover:scale-110">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>

          <div className="pointer-events-none absolute left-[40%] top-1/4 h-[300px] w-[300px] rounded-full border-2 border-primary bg-primary/10" />
          <div className="pointer-events-none absolute left-[10%] top-[10%] h-[400px] w-[500px] rounded-[60%_40%_70%_30%/50%] border-2 border-blue-500/50 bg-blue-500/5" />

          {showMarkers && selectedId && (
            <div className="group absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-4 animate-ping rounded-full bg-primary/20" />
                <div className="relative z-10 rounded-full bg-primary p-2 text-on-primary shadow-lg">
                  <span className="material-symbols-outlined">bakery_dining</span>
                </div>
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-outline-variant bg-surface px-3 py-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  <p className="font-sans text-label-md">
                    {zones.find((z) => z.id === selectedId)?.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-10 left-6 w-72 rounded-2xl border border-outline-variant/30 bg-surface/90 p-5 shadow-xl backdrop-blur-md">
            <h5 className="mb-4 font-sans text-label-md text-on-surface">Zonas de Cobertura</h5>
            <div className="space-y-3">
              {COVERAGE_ZONES.map((zone) => (
                <div key={zone.label} className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 rounded-full border-2", zone.className)} />
                  <span className="font-sans text-body-md">{zone.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-outline-variant/50 pt-4">
              <label className="group flex cursor-pointer items-center gap-3">
                <div className="relative h-6 w-10 rounded-full bg-outline-variant transition-colors group-hover:bg-outline">
                  <div
                    className={cn(
                      "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform",
                      showMarkers && "translate-x-4"
                    )}
                  />
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                />
                <span className="font-sans text-label-sm">Mostrar marcadores</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {modalZone !== undefined && (
        <ZoneModal zone={modalZone} onClose={() => setModalZone(undefined)} />
      )}
    </div>
  );
}

function ZoneModal({
  zone,
  onClose,
}: {
  zone: DeliveryZone | null;
  onClose: () => void;
}) {
  const action = zone ? updateDeliveryZoneAction.bind(null, zone.id) : createDeliveryZoneAction;
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
    if (!zone) return;
    if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) return;
    startDelete(async () => {
      await deleteDeliveryZoneAction(zone.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-serif text-headline-sm text-primary">
            {zone ? "Editar Zona" : "Añadir Zona de Reparto"}
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
            <span className="font-sans text-label-md text-on-surface-variant">Nombre</span>
            <input
              name="name"
              type="text"
              required
              defaultValue={zone?.name}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Descripción</span>
            <input
              name="description"
              type="text"
              defaultValue={zone?.description ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Códigos postales (separados por coma)
            </span>
            <input
              name="postalCodes"
              type="text"
              placeholder="28001, 28004..."
              defaultValue={zone?.postal_codes.join(", ") ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Días de reparto (separados por coma)
            </span>
            <input
              name="deliveryDays"
              type="text"
              placeholder="lunes, miercoles..."
              defaultValue={zone?.delivery_days.join(", ") ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            {zone ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-sans text-label-md text-error hover:underline"
              >
                {isDeleting ? "Eliminando..." : "Eliminar zona"}
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
