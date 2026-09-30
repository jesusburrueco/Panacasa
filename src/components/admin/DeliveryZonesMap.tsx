"use client";

// Este componente solo debe cargarse via next/dynamic con { ssr: false } (ver
// ZonasManager.tsx). "leaflet" toca `window`/`document` en cuanto se
// importa, asi que evitamos cualquier import estatico del paquete y solo lo
// resolvemos en el cliente, dentro de un useEffect, tras montar.
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { DivIcon, LeafletEvent, Marker as LeafletMarker } from "leaflet";
import { MADRID_CENTER } from "@/lib/map-constants";

export interface ZoneMapItem {
  id: string;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  is_active: boolean;
}

export interface PointMapItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Zona o punto que se esta creando/editando (aun sin guardar). */
export type MapDraft =
  | { kind: "zone"; id: string | null; center: LatLng | null; radius: number }
  | { kind: "point"; id: string | null; position: LatLng | null };

interface MapIcons {
  zone: DivIcon;
  point: DivIcon;
  draftZone: DivIcon;
  draftPoint: DivIcon;
}

function useLeafletIcons(): MapIcons | null {
  const [icons, setIcons] = useState<MapIcons | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled) return;
      const L = leafletModule.default;

      const make = (colorClassName: string, materialIcon: string, extra = "") =>
        L.divIcon({
          className: "",
          html: `<div class="flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${colorClassName} text-white shadow-lg ring-2 ring-white ${extra}">
            <span class="material-symbols-outlined" style="font-size: 20px;">${materialIcon}</span>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

      setIcons({
        zone: make("bg-primary", "distance"),
        point: make("bg-tertiary-container", "apartment"),
        draftZone: make("bg-primary", "add_location_alt", "animate-pulse ring-4"),
        draftPoint: make("bg-green-600", "add_location", "animate-pulse ring-4"),
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return icons;
}

function MapClickHandler({ onClick }: { onClick?: (position: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onClick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

/** Lee la posicion final de un marcador arrastrado. */
function dragEndPosition(event: LeafletEvent): LatLng {
  const { lat, lng } = (event.target as LeafletMarker).getLatLng();
  return { lat, lng };
}

interface DeliveryZonesMapProps {
  zones: ZoneMapItem[];
  points: PointMapItem[];
  draft: MapDraft | null;
  focusPosition?: [number, number] | null;
  onMapClick?: (position: LatLng) => void;
  onDraftMove?: (position: LatLng) => void;
  onZoneMarkerClick?: (id: string) => void;
  onPointMarkerClick?: (id: string) => void;
  onZoneDragEnd?: (id: string, position: LatLng) => void;
  onPointDragEnd?: (id: string, position: LatLng) => void;
}

const ZONE_COLOR = "#6c2f00";
const ZONE_INACTIVE_COLOR = "#877369";

function DeliveryZonesMap({
  zones,
  points,
  draft,
  focusPosition,
  onMapClick,
  onDraftMove,
  onZoneMarkerClick,
  onPointMarkerClick,
  onZoneDragEnd,
  onPointDragEnd,
}: DeliveryZonesMapProps) {
  // useLeafletIcons solo resuelve `icons` dentro de un useEffect (que nunca
  // corre en el servidor), asi que mientras `icons` sea null no se renderiza
  // <MapContainer> ni se toca Leaflet.
  const icons = useLeafletIcons();

  if (!icons) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
        <p className="font-sans text-body-md text-on-surface-variant">Cargando mapa…</p>
      </div>
    );
  }

  // El elemento en edicion se pinta como borrador; su version guardada se oculta.
  const editingZoneId = draft?.kind === "zone" ? draft.id : null;
  const editingPointId = draft?.kind === "point" ? draft.id : null;

  return (
    <MapContainer
      center={MADRID_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
      style={{ cursor: "crosshair" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onClick={onMapClick} />
      {focusPosition && <MapFocus position={focusPosition} />}

      {zones.map((zone) => {
        if (zone.id === editingZoneId) return null;
        if (zone.center_lat == null || zone.center_lng == null) return null;
        const position: [number, number] = [zone.center_lat, zone.center_lng];
        const color = zone.is_active ? ZONE_COLOR : ZONE_INACTIVE_COLOR;
        return (
          <Fragment key={zone.id}>
            {zone.radius_meters ? (
              <Circle
                center={position}
                radius={zone.radius_meters}
                // Los circulos propagan el click al mapa (bubblingMouseEvents),
                // asi que un click dentro de una zona tambien coloca el punto.
                pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2 }}
              />
            ) : null}
            <Marker
              position={position}
              icon={icons.zone}
              draggable
              eventHandlers={{
                click: () => onZoneMarkerClick?.(zone.id),
                dragend: (e) => onZoneDragEnd?.(zone.id, dragEndPosition(e)),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                {zone.name}
              </Tooltip>
            </Marker>
          </Fragment>
        );
      })}

      {points.map((point) =>
        point.id === editingPointId ? null : (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={icons.point}
            draggable
            eventHandlers={{
              click: () => onPointMarkerClick?.(point.id),
              dragend: (e) => onPointDragEnd?.(point.id, dragEndPosition(e)),
            }}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              {point.name}
            </Tooltip>
          </Marker>
        )
      )}

      {draft?.kind === "zone" && draft.center && (
        <>
          <Circle
            center={[draft.center.lat, draft.center.lng]}
            radius={draft.radius}
            pathOptions={{ color: ZONE_COLOR, fillColor: ZONE_COLOR, fillOpacity: 0.18, weight: 2, dashArray: "6 6" }}
          />
          <Marker
            position={[draft.center.lat, draft.center.lng]}
            icon={icons.draftZone}
            draggable
            eventHandlers={{ dragend: (e) => onDraftMove?.(dragEndPosition(e)) }}
          >
            <Popup>Centro de la zona · arrástralo para ajustarlo</Popup>
          </Marker>
        </>
      )}

      {draft?.kind === "point" && draft.position && (
        <Marker
          position={[draft.position.lat, draft.position.lng]}
          icon={icons.draftPoint}
          draggable
          eventHandlers={{ dragend: (e) => onDraftMove?.(dragEndPosition(e)) }}
        >
          <Tooltip direction="top" offset={[0, -18]} permanent>
            Nuevo punto
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}

export default DeliveryZonesMap;
