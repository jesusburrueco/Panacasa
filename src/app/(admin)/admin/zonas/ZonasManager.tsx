"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";
import {
  createDeliveryZoneAction,
  deleteDeliveryZoneAction,
  moveDeliveryZoneCenterAction,
  toggleDeliveryZoneActiveAction,
  updateDeliveryZoneAction,
  type DeliveryZoneActionState,
} from "@/lib/supabase/delivery-zone-actions";
import {
  createDeliveryPointAction,
  deleteDeliveryPointAction,
  moveDeliveryPointAction,
  updateDeliveryPointAction,
  type DeliveryPointActionState,
} from "@/lib/supabase/delivery-point-actions";
import { AddressSearch, type AddressResult } from "@/components/admin/AddressSearch";
import type { LatLng } from "@/components/admin/DeliveryZonesMap";

type DeliveryZone = Tables<"delivery_zones">;
type DeliveryPoint = Tables<"delivery_points">;

/** Cliente con direccion en una zona (referencia al revisar urbanizaciones). */
export interface ZoneCustomer {
  id: string;
  full_name: string | null;
  address: string | null;
  delivery_zone_id: string | null;
}

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

const RADIUS_MIN = 200;
const RADIUS_MAX = 5000;
const RADIUS_DEFAULT = 1000;

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

type Tab = "zonas" | "puntos";

interface ZoneDraft {
  kind: "zone";
  id: string | null;
  center: LatLng | null;
  radius: number;
  name: string;
  description: string;
  postalCodes: string;
  isActive: boolean;
}

interface PointDraft {
  kind: "point";
  id: string | null;
  position: LatLng | null;
  name: string;
  address: string;
  zoneId: string;
}

type Draft = ZoneDraft | PointDraft;

function zoneDraft(zone: DeliveryZone | null): ZoneDraft {
  return {
    kind: "zone",
    id: zone?.id ?? null,
    center:
      zone?.center_lat != null && zone?.center_lng != null
        ? { lat: zone.center_lat, lng: zone.center_lng }
        : null,
    radius: zone?.radius_meters ?? RADIUS_DEFAULT,
    name: zone?.name ?? "",
    description: zone?.description ?? "",
    postalCodes: zone?.postal_codes.join(", ") ?? "",
    isActive: zone?.is_active ?? true,
  };
}

function pointDraft(point: Partial<DeliveryPoint> & { position?: LatLng | null }): PointDraft {
  return {
    kind: "point",
    id: point.id ?? null,
    position:
      point.position ?? (point.lat != null && point.lng != null ? { lat: point.lat, lng: point.lng } : null),
    name: point.name ?? "",
    address: point.address ?? "",
    zoneId: point.zone_id ?? "",
  };
}

/** Distancia en metros entre dos coordenadas (haversine). */
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Zona cuyo circulo contiene la posicion (la de centro mas cercano). */
function zoneContaining(zones: DeliveryZone[], position: LatLng): DeliveryZone | null {
  let best: { zone: DeliveryZone; distance: number } | null = null;
  for (const zone of zones) {
    if (zone.center_lat == null || zone.center_lng == null || !zone.radius_meters) continue;
    const distance = distanceMeters({ lat: zone.center_lat, lng: zone.center_lng }, position);
    if (distance <= zone.radius_meters && (!best || distance < best.distance)) {
      best = { zone, distance };
    }
  }
  return best?.zone ?? null;
}

function formatRadius(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km` : `${meters} m`;
}

function formatCoords(position: LatLng) {
  return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
}

export function ZonasManager({
  zones,
  points,
  customers,
}: {
  zones: DeliveryZone[];
  points: DeliveryPoint[];
  customers: ZoneCustomer[];
}) {
  const [tab, setTab] = useState<Tab>("zonas");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // Si falla un arrastre, se remonta el mapa para devolver el marcador a su sitio.
  const [markersVersion, setMarkersVersion] = useState(0);
  const [isToggling, startToggle] = useTransition();
  const [, startMove] = useTransition();

  const zoneById = useMemo(() => new Map(zones.map((zone) => [zone.id, zone])), [zones]);

  useEffect(() => {
    if (!draft) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setDraft(null);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [draft]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function focus(position: LatLng) {
    setFocusPosition([position.lat, position.lng]);
  }

  function startNewPoint(position: LatLng | null, extra: Partial<PointDraft> = {}) {
    const detected = position ? zoneContaining(zones, position) : null;
    setTab("puntos");
    setDraft({
      ...pointDraft({ position }),
      zoneId: detected?.id ?? selectedZoneId ?? "",
      ...extra,
    });
  }

  function handleMapClick(position: LatLng) {
    if (draft?.kind === "zone") {
      setDraft({ ...draft, center: position });
    } else if (draft?.kind === "point") {
      // Si el admin aun no ha elegido zona, se propone la que contiene el punto.
      const detected = zoneContaining(zones, position);
      setDraft({ ...draft, position, zoneId: draft.zoneId || detected?.id || "" });
    } else {
      startNewPoint(position);
    }
  }

  function handleDraftMove(position: LatLng) {
    if (draft?.kind === "zone") setDraft({ ...draft, center: position });
    if (draft?.kind === "point") setDraft({ ...draft, position });
  }

  function handleSearchSelect(result: AddressResult) {
    const position = { lat: result.lat, lng: result.lng };
    focus(position);
    if (draft?.kind === "zone") {
      setDraft({ ...draft, center: position, name: draft.name || result.name });
    } else if (draft?.kind === "point") {
      setDraft({
        ...draft,
        position,
        name: draft.name || result.name,
        address: draft.address || result.label,
      });
    } else {
      startNewPoint(position, { name: result.name, address: result.label });
    }
  }

  function moveMarker(label: string, move: () => Promise<{ error: string | null }>) {
    startMove(async () => {
      const { error } = await move();
      if (error) {
        setMarkersVersion((v) => v + 1);
        setNotice({ kind: "error", text: error });
      } else {
        setNotice({ kind: "success", text: `${label}: nueva ubicación guardada.` });
      }
    });
  }

  const pointsForList = points
    .filter((point) => !selectedZoneId || point.zone_id === selectedZoneId)
    .sort((a, b) => collator.compare(a.name, b.name));
  const unassignedPoints = points.filter((point) => !point.zone_id);
  const customerAddresses = useMemo(() => {
    const byAddress = new Map<string, ZoneCustomer[]>();
    for (const customer of customers) {
      if (customer.delivery_zone_id !== selectedZoneId) continue;
      const address = customer.address?.trim() || "Sin dirección";
      byAddress.set(address, [...(byAddress.get(address) ?? []), customer]);
    }
    return Array.from(byAddress, ([address, list]) => ({ address, customers: list })).sort((a, b) =>
      collator.compare(a.address, b.address)
    );
  }, [customers, selectedZoneId]);

  const mapHint =
    draft?.kind === "zone"
      ? draft.center
        ? "Arrastra el centro o haz click para moverlo · ajusta el radio en el panel"
        : "Haz click en el mapa para fijar el centro de la zona"
      : draft?.kind === "point"
        ? draft.position
          ? "Arrastra el marcador para afinar la posición"
          : "Haz click en el mapa para colocar el punto"
        : "Click en el mapa para añadir un punto · arrastra los marcadores para moverlos";

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:h-screen">
      <header className="flex flex-col gap-4 border-b border-outline-variant/30 bg-surface px-margin-mobile py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-margin-desktop">
        <div>
          <h2 className="font-serif text-headline-sm text-primary">Zonas y puntos de entrega</h2>
          <p className="font-sans text-label-sm text-on-surface-variant">
            Zonas = barrios o áreas de reparto · Puntos = urbanizaciones dentro de cada zona
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setTab("zonas");
              setDraft(zoneDraft(null));
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-sans text-label-md text-on-primary shadow-md transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined">add_location_alt</span>
            Añadir zona
          </button>
          <button
            type="button"
            onClick={() => startNewPoint(null)}
            className="flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined">add_location</span>
            Añadir punto
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Panel lateral: formulario del borrador o listados. El mapa queda
            siempre visible para poder hacer click mientras se rellena. */}
        <section className="order-2 flex w-full flex-col border-r border-outline-variant bg-surface-container-low lg:order-1 lg:w-[400px] lg:overflow-hidden">
          {draft?.kind === "zone" ? (
            <ZoneForm
              key={draft.id ?? "new-zone"}
              draft={draft}
              onChange={setDraft}
              onClose={() => setDraft(null)}
            />
          ) : draft?.kind === "point" ? (
            <PointForm
              key={draft.id ?? "new-point"}
              draft={draft}
              zones={zones}
              onChange={setDraft}
              onClose={() => setDraft(null)}
            />
          ) : (
            <>
              <div className="border-b border-outline-variant p-6">
                <span className="mb-1 block font-sans text-label-sm text-on-surface-variant">
                  REPARTO A DOMICILIO
                </span>
                <div className="flex gap-2 rounded-full bg-surface-container-high p-1">
                  {(
                    [
                      ["zonas", `Zonas (${zones.length})`],
                      ["puntos", `Puntos (${points.length})`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2 font-sans text-label-md transition-colors",
                        tab === id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {tab === "zonas" &&
                  (zones.length === 0 ? (
                    <EmptyHint icon="distance">
                      Todavía no hay zonas. Pulsa <strong>Añadir zona</strong> y haz click en el
                      mapa sobre el barrio donde repartís.
                    </EmptyHint>
                  ) : (
                    zones.map((zone) => {
                      const zonePoints = points.filter((p) => p.zone_id === zone.id).length;
                      const zoneCustomers = customers.filter((c) => c.delivery_zone_id === zone.id).length;
                      const center =
                        zone.center_lat != null && zone.center_lng != null
                          ? { lat: zone.center_lat, lng: zone.center_lng }
                          : null;
                      return (
                        <div
                          key={zone.id}
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            if (center) focus(center);
                          }}
                          className={cn(
                            "w-full cursor-pointer rounded-xl border bg-surface p-4 text-left shadow-sm transition-all hover:border-outline-variant",
                            selectedZoneId === zone.id
                              ? "border-l-4 border-l-primary border-y-transparent border-r-transparent"
                              : "border-transparent"
                          )}
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                                <span className="material-symbols-outlined">distance</span>
                              </div>
                              <div>
                                <h4 className="font-sans text-label-md text-on-surface">{zone.name}</h4>
                                <p className="font-sans text-label-sm text-on-surface-variant">
                                  {zone.radius_meters ? `Radio ${formatRadius(zone.radius_meters)}` : "Sin radio"}
                                  {zone.postal_codes.length > 0 && ` · CP ${zone.postal_codes.join(", ")}`}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedZoneId(zone.id);
                                    setTab("puntos");
                                  }}
                                  className="font-sans text-label-sm text-tertiary hover:underline"
                                >
                                  {zonePoints} {zonePoints === 1 ? "punto" : "puntos"} ·{" "}
                                  {zoneCustomers} {zoneCustomers === 1 ? "cliente" : "clientes"}
                                </button>
                                {!center && (
                                  <p className="mt-1 font-sans text-label-sm text-error">
                                    Sin ubicación: edítala y haz click en el mapa
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
                                aria-label={`Zona ${zone.name} activa`}
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
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDraft(zoneDraft(zone));
                                if (center) focus(center);
                              }}
                              className="flex items-center gap-1 rounded-full px-3 py-1.5 font-sans text-label-sm text-primary hover:bg-surface-variant"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Editar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ))}

                {tab === "puntos" && (
                  <>
                    <label className="block">
                      <span className="font-sans text-label-sm text-on-surface-variant">
                        Zona de reparto
                      </span>
                      <select
                        value={selectedZoneId ?? ""}
                        onChange={(e) => setSelectedZoneId(e.target.value || null)}
                        className="mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Todas las zonas</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {!selectedZoneId && unassignedPoints.length > 0 && (
                      <p className="rounded-lg bg-tertiary-fixed/50 px-4 py-3 font-sans text-label-sm text-on-surface">
                        {unassignedPoints.length}{" "}
                        {unassignedPoints.length === 1 ? "punto no tiene" : "puntos no tienen"} zona
                        asignada.
                      </p>
                    )}

                    {pointsForList.length === 0 ? (
                      <EmptyHint icon="apartment">
                        No hay puntos en esta zona. Haz click en el mapa o busca una dirección para
                        añadir una urbanización.
                      </EmptyHint>
                    ) : (
                      pointsForList.map((point) => (
                        <div
                          key={point.id}
                          onClick={() => focus(point)}
                          className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-surface p-4 shadow-sm transition-colors hover:bg-surface-container"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                              <span className="material-symbols-outlined">apartment</span>
                            </div>
                            <div>
                              <h4 className="font-sans text-label-md text-on-surface">{point.name}</h4>
                              {point.address && (
                                <p className="line-clamp-2 font-sans text-label-sm text-on-surface-variant">
                                  {point.address}
                                </p>
                              )}
                              <p className="font-sans text-label-sm text-tertiary">
                                {point.zone_id ? zoneById.get(point.zone_id)?.name : "Sin zona"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraft(pointDraft(point));
                              focus(point);
                            }}
                            aria-label={`Editar ${point.name}`}
                            className="rounded-full p-2 text-primary hover:bg-surface-variant"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        </div>
                      ))
                    )}

                    {selectedZoneId && customerAddresses.length > 0 && (
                      <details className="rounded-xl bg-surface-container p-4">
                        <summary className="cursor-pointer font-sans text-label-md text-on-surface-variant">
                          Direcciones de clientes en esta zona ({customerAddresses.length})
                        </summary>
                        <ul className="mt-3 space-y-2">
                          {customerAddresses.map((entry) => (
                            <li key={entry.address} className="font-sans text-label-sm">
                              <span className="text-on-surface">{entry.address}</span>
                              <span className="text-on-surface-variant"> · </span>
                              {entry.customers.map((customer, index) => (
                                <span key={customer.id}>
                                  {index > 0 && ", "}
                                  <Link
                                    href={`/admin/suscriptores/${customer.id}`}
                                    className="text-primary hover:underline"
                                  >
                                    {customer.full_name ?? "Cliente"}
                                  </Link>
                                </span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>

        {/* Mapa */}
        <section className="relative order-1 h-[55vh] overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <DeliveryZonesMap
            key={markersVersion}
            zones={zones}
            points={points}
            draft={draft}
            focusPosition={focusPosition}
            onMapClick={handleMapClick}
            onDraftMove={handleDraftMove}
            onZoneMarkerClick={(id) => {
              setSelectedZoneId(id);
              setTab("zonas");
            }}
            onPointMarkerClick={(id) => {
              const point = points.find((p) => p.id === id);
              if (point) setDraft(pointDraft(point));
            }}
            onZoneDragEnd={(id, position) =>
              moveMarker(zoneById.get(id)?.name ?? "Zona", () =>
                moveDeliveryZoneCenterAction(id, position.lat, position.lng)
              )
            }
            onPointDragEnd={(id, position) =>
              moveMarker(points.find((p) => p.id === id)?.name ?? "Punto", () =>
                moveDeliveryPointAction(id, position.lat, position.lng)
              )
            }
          />

          <div className="absolute left-4 right-4 top-4 z-[1000] mx-auto max-w-lg">
            <AddressSearch onSelect={handleSearchSelect} />
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 z-[1000] w-max max-w-[90%] -translate-x-1/2 rounded-full bg-primary/90 px-5 py-2 text-center shadow-lg">
            <p className="font-sans text-label-sm text-on-primary">{mapHint}</p>
          </div>

          {notice && (
            <p
              role="status"
              className={cn(
                "absolute right-4 top-24 z-[1000] rounded-lg px-4 py-3 font-sans text-label-md shadow-lg",
                notice.kind === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-error-container text-on-error-container"
              )}
            >
              {notice.text}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyHint({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <span className="material-symbols-outlined text-3xl text-outline">{icon}</span>
      <p className="font-sans text-body-md text-on-surface-variant">{children}</p>
    </div>
  );
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-outline-variant bg-surface p-3 font-sans text-body-md shadow-inset focus:border-primary focus:ring-2 focus:ring-primary";

/** Cierra el panel cuando la accion del formulario termina sin error. */
function useCloseOnSuccess(isPending: boolean, error: string | null, onClose: () => void) {
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !error) onClose();
    wasPending.current = isPending;
  }, [isPending, error, onClose]);
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant p-6">
      <h3 className="font-serif text-headline-sm text-primary">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="rounded-full p-2 transition-colors hover:bg-surface-variant"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}

function LocationStatus({ position, emptyText }: { position: LatLng | null; emptyText: string }) {
  return position ? (
    <p className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 font-sans text-label-sm text-green-800">
      <span className="material-symbols-outlined text-[18px]">check_circle</span>
      Ubicación fijada · {formatCoords(position)}
    </p>
  ) : (
    <p className="flex items-center gap-2 rounded-lg bg-tertiary-fixed/60 px-4 py-3 font-sans text-label-sm text-on-surface">
      <span className="material-symbols-outlined text-[18px] text-tertiary">touch_app</span>
      {emptyText}
    </p>
  );
}

function ZoneForm({
  draft,
  onChange,
  onClose,
}: {
  draft: ZoneDraft;
  onChange: (draft: ZoneDraft) => void;
  onClose: () => void;
}) {
  const initialState: DeliveryZoneActionState = { error: null };
  const action = draft.id ? updateDeliveryZoneAction.bind(null, draft.id) : createDeliveryZoneAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();
  useCloseOnSuccess(isPending, state.error, onClose);

  const handleDelete = () => {
    const zoneId = draft.id;
    if (!zoneId) return;
    if (!confirm(`¿Eliminar la zona "${draft.name}"?`)) return;
    startDelete(async () => {
      await deleteDeliveryZoneAction(zoneId);
      onClose();
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PanelHeader title={draft.id ? "Editar zona" : "Nueva zona de reparto"} onClose={onClose} />
      <form action={formAction} className="space-y-5 p-6">
        {state.error && <FormError message={state.error} />}

        <LocationStatus
          position={draft.center}
          emptyText="Haz click en el mapa (o busca una dirección) para fijar el centro del barrio."
        />
        <input type="hidden" name="centerLat" value={draft.center?.lat ?? ""} />
        <input type="hidden" name="centerLng" value={draft.center?.lng ?? ""} />

        <label className="block">
          <span className="flex items-center justify-between font-sans text-label-md text-on-surface-variant">
            Radio de cobertura
            <span className="font-serif text-headline-sm text-primary">{formatRadius(draft.radius)}</span>
          </span>
          <input
            type="range"
            name="radiusMeters"
            min={RADIUS_MIN}
            max={RADIUS_MAX}
            step={50}
            value={draft.radius}
            onChange={(e) => onChange({ ...draft, radius: Number(e.target.value) })}
            className="mt-2 w-full accent-primary"
          />
          <span className="flex justify-between font-sans text-[11px] text-outline">
            <span>{formatRadius(RADIUS_MIN)}</span>
            <span>{formatRadius(RADIUS_MAX)}</span>
          </span>
        </label>

        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Nombre del barrio o área</span>
          <input
            name="name"
            type="text"
            required
            placeholder="Carabanchel"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Descripción</span>
          <input
            name="description"
            type="text"
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">
            Códigos postales (separados por coma)
          </span>
          <input
            name="postalCodes"
            type="text"
            placeholder="28019, 28025..."
            value={draft.postalCodes}
            onChange={(e) => onChange({ ...draft, postalCodes: e.target.value })}
            className={inputClass}
          />
          <span className="mt-1 block font-sans text-[11px] text-outline">
            Se usan en el comprobador de cobertura de la web.
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            name="isActive"
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => onChange({ ...draft, isActive: e.target.checked })}
            className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <span className="font-sans text-label-md text-on-surface-variant">Zona activa</span>
        </label>

        <FormActions
          isPending={isPending}
          canSubmit={Boolean(draft.center) || Boolean(draft.id)}
          submitLabel="Guardar zona"
          onCancel={onClose}
          onDelete={draft.id ? handleDelete : undefined}
          deleteLabel={isDeleting ? "Eliminando..." : "Eliminar zona"}
        />
      </form>
    </div>
  );
}

function PointForm({
  draft,
  zones,
  onChange,
  onClose,
}: {
  draft: PointDraft;
  zones: DeliveryZone[];
  onChange: (draft: PointDraft) => void;
  onClose: () => void;
}) {
  const initialState: DeliveryPointActionState = { error: null };
  const action = draft.id ? updateDeliveryPointAction.bind(null, draft.id) : createDeliveryPointAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();
  useCloseOnSuccess(isPending, state.error, onClose);

  const handleDelete = () => {
    const pointId = draft.id;
    if (!pointId) return;
    if (!confirm(`¿Eliminar el punto "${draft.name}"?`)) return;
    startDelete(async () => {
      await deleteDeliveryPointAction(pointId);
      onClose();
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PanelHeader title={draft.id ? "Editar punto de entrega" : "Nuevo punto de entrega"} onClose={onClose} />
      <form action={formAction} className="space-y-5 p-6">
        {state.error && <FormError message={state.error} />}

        <LocationStatus
          position={draft.position}
          emptyText="Haz click en el mapa (o busca una dirección) para colocar la urbanización."
        />
        <input type="hidden" name="lat" value={draft.position?.lat ?? ""} />
        <input type="hidden" name="lng" value={draft.position?.lng ?? ""} />

        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Nombre de la urbanización</span>
          <input
            name="name"
            type="text"
            required
            placeholder="Urb. Montepinar"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Dirección</span>
          <textarea
            name="address"
            rows={2}
            placeholder="Calle de Ejemplo 12, Madrid"
            value={draft.address}
            onChange={(e) => onChange({ ...draft, address: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-sans text-label-md text-on-surface-variant">Zona de reparto</span>
          <select
            name="zoneId"
            value={draft.zoneId}
            onChange={(e) => onChange({ ...draft, zoneId: e.target.value })}
            className={inputClass}
          >
            <option value="">Sin zona</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block font-sans text-[11px] text-outline">
            Se propone la zona cuyo radio contiene el punto.
          </span>
        </label>

        <FormActions
          isPending={isPending}
          canSubmit={Boolean(draft.position)}
          submitLabel="Guardar punto"
          onCancel={onClose}
          onDelete={draft.id ? handleDelete : undefined}
          deleteLabel={isDeleting ? "Eliminando..." : "Eliminar punto"}
        />
      </form>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-DEFAULT bg-error-container px-4 py-3 font-sans text-label-md text-on-error-container"
    >
      {message}
    </p>
  );
}

function FormActions({
  isPending,
  canSubmit,
  submitLabel,
  onCancel,
  onDelete,
  deleteLabel,
}: {
  isPending: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onCancel: () => void;
  onDelete?: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-primary px-6 py-3 font-sans text-label-md text-primary transition-colors hover:bg-surface-variant"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="flex-1 rounded-full bg-primary px-6 py-3 font-sans text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : submitLabel}
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full text-center font-sans text-label-md text-error hover:underline"
        >
          {deleteLabel}
        </button>
      )}
    </div>
  );
}
