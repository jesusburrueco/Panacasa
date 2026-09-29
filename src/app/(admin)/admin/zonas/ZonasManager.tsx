"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  createDeliveryZoneAction,
  deleteDeliveryZoneAction,
  toggleDeliveryZoneActiveAction,
  updateDeliveryZoneAction,
  type DeliveryZoneActionState,
} from "@/lib/supabase/delivery-zone-actions";
import {
  createPickupPointAction,
  deletePickupPointAction,
  updatePickupPointAction,
  type PickupPointActionState,
} from "@/lib/supabase/pickup-point-actions";
import { MADRID_CENTER } from "@/lib/map-constants";

type DeliveryZone = Tables<"delivery_zones">;
type PickupPoint = Tables<"pickup_points">;

// Leaflet solo puede ejecutarse en el navegador (usa `window`/`document` al
// importarse), asi que el mapa se carga exclusivamente en cliente. Ningun
// otro archivo debe importar "@/components/admin/DeliveryZonesMap" de forma
// estatica: eso arrastraria "leaflet" al bundle de servidor y rompe el SSR.
const DeliveryZonesMap = dynamic(() => import("@/components/admin/DeliveryZonesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
      <p className="font-sans text-body-md text-on-surface-variant">Cargando mapa…</p>
    </div>
  ),
});

const zoneInitialState: DeliveryZoneActionState = { error: null };
const pointInitialState: PickupPointActionState = { error: null };

type Tab = "zonas" | "puntos";

export function ZonasManager({
  zones,
  pickupPoints,
}: {
  zones: DeliveryZone[];
  pickupPoints: PickupPoint[];
}) {
  const [tab, setTab] = useState<Tab>("zonas");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id ?? null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [modalZone, setModalZone] = useState<DeliveryZone | null | undefined>(undefined);
  const [modalPoint, setModalPoint] = useState<PickupPoint | null | undefined>(undefined);
  const [pickedPosition, setPickedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isToggling, startToggle] = useTransition();

  const pickingActive = modalZone !== undefined || modalPoint !== undefined;

  const focusPosition = useMemo<[number, number] | null>(() => {
    if (tab === "zonas" && selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone?.center_lat != null && zone?.center_lng != null) {
        return [zone.center_lat, zone.center_lng];
      }
    }
    if (tab === "puntos" && selectedPointId) {
      const point = pickupPoints.find((p) => p.id === selectedPointId);
      if (point) return [point.lat, point.lng];
    }
    return null;
  }, [tab, selectedZoneId, selectedPointId, zones, pickupPoints]);

  function openZoneModal(zone: DeliveryZone | null) {
    setPickedPosition(null);
    setModalZone(zone);
  }

  function openPointModal(point: PickupPoint | null) {
    setPickedPosition(null);
    setModalPoint(point);
  }

  return (
    <div className="flex h-screen flex-1 flex-col">
      <header className="flex flex-col gap-4 border-b border-outline-variant/30 bg-surface px-margin-mobile py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-margin-desktop">
        <h2 className="font-serif text-headline-sm text-primary">Logística</h2>
        <div className="flex gap-3">
          {tab === "zonas" ? (
            <button
              type="button"
              onClick={() => openZoneModal(null)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined">add_location_alt</span>
              Añadir Zona
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openPointModal(null)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined">add_business</span>
              Añadir Punto de Recogida
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <section className="flex w-full flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low lg:w-[400px]">
          <div className="border-b border-outline-variant p-6">
            <span className="mb-1 block font-sans text-label-sm text-on-surface-variant">
              GESTIÓN DE LOGÍSTICA
            </span>
            <div className="flex gap-2 rounded-full bg-surface-container-high p-1">
              <button
                type="button"
                onClick={() => setTab("zonas")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 font-sans text-label-md transition-colors",
                  tab === "zonas"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                )}
              >
                Zonas ({zones.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("puntos")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 font-sans text-label-md transition-colors",
                  tab === "puntos"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                )}
              >
                Puntos ({pickupPoints.length})
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {tab === "zonas" &&
              (zones.length === 0 ? (
                <p className="p-4 text-center font-sans text-body-md text-on-surface-variant">
                  Todavía no hay zonas de reparto configuradas.
                </p>
              ) : (
                zones.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={cn(
                      "group w-full cursor-pointer rounded-xl border bg-surface p-4 text-left shadow-sm transition-all hover:border-outline-variant",
                      selectedZoneId === zone.id
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
                          {zone.center_lat == null && (
                            <p className="mt-1 font-sans text-label-sm text-tertiary">
                              Sin ubicación en el mapa
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
                          openZoneModal(zone);
                        }}
                        aria-label={`Editar ${zone.name}`}
                        className="rounded-full p-2 text-outline hover:bg-surface-variant"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                  </div>
                ))
              ))}

            {tab === "puntos" &&
              (pickupPoints.length === 0 ? (
                <p className="p-4 text-center font-sans text-body-md text-on-surface-variant">
                  Todavía no hay puntos de recogida configurados.
                </p>
              ) : (
                pickupPoints.map((point) => (
                  <div
                    key={point.id}
                    onClick={() => setSelectedPointId(point.id)}
                    className={cn(
                      "group w-full cursor-pointer rounded-xl border bg-surface p-4 text-left shadow-sm transition-all hover:border-outline-variant",
                      selectedPointId === point.id
                        ? "border-l-4 border-l-primary border-y-transparent border-r-transparent"
                        : "border-transparent"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                          <span className="material-symbols-outlined">storefront</span>
                        </div>
                        <div>
                          <h4 className="font-sans text-label-md text-on-surface">{point.name}</h4>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            {point.address}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-[12px] font-bold",
                          point.status === "abierto"
                            ? "bg-green-500/20 text-green-700"
                            : "bg-error-container text-on-error-container"
                        )}
                      >
                        {point.status === "abierto" ? "ABIERTO" : "CERRADO"}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPointModal(point);
                        }}
                        aria-label={`Editar ${point.name}`}
                        className="rounded-full p-2 text-outline hover:bg-surface-variant"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                  </div>
                ))
              ))}
          </div>
        </section>

        {/* Mapa */}
        <section className="relative hidden flex-1 overflow-hidden lg:block">
          <DeliveryZonesMap
            zones={zones}
            pickupPoints={pickupPoints}
            focusPosition={focusPosition}
            pickingActive={pickingActive}
            onMapClick={(lat, lng) => setPickedPosition({ lat, lng })}
            onZoneMarkerClick={setSelectedZoneId}
            onPickupMarkerClick={setSelectedPointId}
          />

          {pickingActive && (
            <div className="pointer-events-none absolute left-1/2 top-6 z-[1000] -translate-x-1/2 rounded-full bg-primary px-5 py-2 shadow-lg">
              <p className="font-sans text-label-md text-on-primary">
                Toca el mapa para fijar la ubicación
              </p>
            </div>
          )}
        </section>
      </div>

      {modalZone !== undefined && (
        <ZoneModal
          zone={modalZone}
          pickedPosition={pickedPosition}
          onClose={() => setModalZone(undefined)}
        />
      )}

      {modalPoint !== undefined && (
        <PointModal
          point={modalPoint}
          zones={zones}
          pickedPosition={pickedPosition}
          onClose={() => setModalPoint(undefined)}
        />
      )}
    </div>
  );
}

function ZoneModal({
  zone,
  pickedPosition,
  onClose,
}: {
  zone: DeliveryZone | null;
  pickedPosition: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const action = zone ? updateDeliveryZoneAction.bind(null, zone.id) : createDeliveryZoneAction;
  const [state, formAction, isPending] = useActionState(action, zoneInitialState);
  const [isDeleting, startDelete] = useTransition();
  const wasPending = useRef(false);

  const [lat, setLat] = useState(zone?.center_lat ?? MADRID_CENTER[0]);
  const [lng, setLng] = useState(zone?.center_lng ?? MADRID_CENTER[1]);
  const [appliedPosition, setAppliedPosition] = useState(pickedPosition);

  if (pickedPosition !== appliedPosition) {
    setAppliedPosition(pickedPosition);
    if (pickedPosition) {
      setLat(pickedPosition.lat);
      setLng(pickedPosition.lng);
    }
  }

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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-container-low shadow-2xl"
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

          <div>
            <span className="mb-1 block font-sans text-label-md text-on-surface-variant">
              Ubicación en el mapa (toca el mapa para fijarla)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-sans text-label-sm text-on-surface-variant">Latitud</span>
                <input
                  name="centerLat"
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="font-sans text-label-sm text-on-surface-variant">Longitud</span>
                <input
                  name="centerLng"
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Radio de cobertura (metros)
            </span>
            <input
              name="radiusMeters"
              type="number"
              min="0"
              step="50"
              placeholder="1500"
              defaultValue={zone?.radius_meters ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={zone?.is_active ?? true}
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="font-sans text-label-md text-on-surface-variant">Zona activa</span>
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

function PointModal({
  point,
  zones,
  pickedPosition,
  onClose,
}: {
  point: PickupPoint | null;
  zones: DeliveryZone[];
  pickedPosition: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const action = point ? updatePickupPointAction.bind(null, point.id) : createPickupPointAction;
  const [state, formAction, isPending] = useActionState(action, pointInitialState);
  const [isDeleting, startDelete] = useTransition();
  const wasPending = useRef(false);

  const [lat, setLat] = useState(point?.lat ?? MADRID_CENTER[0]);
  const [lng, setLng] = useState(point?.lng ?? MADRID_CENTER[1]);
  const [appliedPosition, setAppliedPosition] = useState(pickedPosition);

  if (pickedPosition !== appliedPosition) {
    setAppliedPosition(pickedPosition);
    if (pickedPosition) {
      setLat(pickedPosition.lat);
      setLng(pickedPosition.lng);
    }
  }

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, onClose]);

  const handleDelete = () => {
    if (!point) return;
    if (!confirm(`¿Eliminar el punto "${point.name}"?`)) return;
    startDelete(async () => {
      await deletePickupPointAction(point.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant p-6">
          <h3 className="font-serif text-headline-sm text-primary">
            {point ? "Editar Punto de Recogida" : "Añadir Punto de Recogida"}
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
              defaultValue={point?.name}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Dirección</span>
            <input
              name="address"
              type="text"
              required
              defaultValue={point?.address}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </label>

          <div>
            <span className="mb-1 block font-sans text-label-md text-on-surface-variant">
              Ubicación en el mapa (toca el mapa para fijarla)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-sans text-label-sm text-on-surface-variant">Latitud</span>
                <input
                  name="lat"
                  type="number"
                  step="0.0001"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="font-sans text-label-sm text-on-surface-variant">Longitud</span>
                <input
                  name="lng"
                  type="number"
                  step="0.0001"
                  required
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">
              Zona de reparto asociada
            </span>
            <select
              name="zoneId"
              defaultValue={point?.zone_id ?? ""}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin zona asociada</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-sans text-label-md text-on-surface-variant">Estado</span>
            <select
              name="status"
              defaultValue={point?.status ?? "abierto"}
              className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            {point ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-sans text-label-md text-error hover:underline"
              >
                {isDeleting ? "Eliminando..." : "Eliminar punto"}
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
