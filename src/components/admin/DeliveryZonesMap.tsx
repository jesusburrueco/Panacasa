"use client";

// Este componente solo debe cargarse via next/dynamic con { ssr: false } (ver
// ZonasManager.tsx). "leaflet" toca `window`/`document` en cuanto se
// importa, asi que evitamos cualquier import estatico del paquete y solo lo
// resolvemos en el cliente, dentro de un useEffect, tras montar.
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { DivIcon } from "leaflet";
import { MADRID_CENTER } from "@/lib/map-constants";

export interface ZoneMapItem {
  id: string;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  is_active: boolean;
}

export interface PickupPointMapItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

interface MapIcons {
  zone: DivIcon;
  pickupOpen: DivIcon;
  pickupClosed: DivIcon;
}

function useLeafletIcons(): MapIcons | null {
  const [icons, setIcons] = useState<MapIcons | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    import("leaflet").then((leafletModule) => {
      if (cancelled) return;
      const L = leafletModule.default;

      const make = (colorClassName: string, materialIcon: string) =>
        L.divIcon({
          className: "",
          html: `<div class="flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${colorClassName} text-white shadow-lg ring-2 ring-white">
            <span class="material-symbols-outlined" style="font-size: 20px;">${materialIcon}</span>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

      setIcons({
        zone: make("bg-primary", "distance"),
        pickupOpen: make("bg-green-600", "storefront"),
        pickupClosed: make("bg-outline", "storefront"),
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return icons;
}

function MapClickHandler({
  active,
  onClick,
}: {
  active: boolean;
  onClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (active && onClick) {
        onClick(event.latlng.lat, event.latlng.lng);
      }
    },
  });
  return null;
}

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

interface DeliveryZonesMapProps {
  zones: ZoneMapItem[];
  pickupPoints: PickupPointMapItem[];
  focusPosition?: [number, number] | null;
  pickingActive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onZoneMarkerClick?: (id: string) => void;
  onPickupMarkerClick?: (id: string) => void;
}

function DeliveryZonesMap({
  zones,
  pickupPoints,
  focusPosition,
  pickingActive = false,
  onMapClick,
  onZoneMarkerClick,
  onPickupMarkerClick,
}: DeliveryZonesMapProps) {
  // useLeafletIcons solo resuelve `icons` dentro de un useEffect (que nunca
  // corre en el servidor), asi que mientras `icons` sea null no se renderiza
  // <MapContainer> ni se toca Leaflet: esto ya actua como guarda equivalente
  // a comprobar `typeof window !== "undefined"` antes de montar el mapa.
  const icons = useLeafletIcons();

  if (!icons) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
        <p className="font-sans text-body-md text-on-surface-variant">Cargando mapa…</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={MADRID_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
      style={{ cursor: pickingActive ? "crosshair" : undefined }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler active={pickingActive} onClick={onMapClick} />
      {focusPosition && <MapFocus position={focusPosition} />}

      {zones.map((zone) => {
        if (zone.center_lat == null || zone.center_lng == null) return null;
        const position: [number, number] = [zone.center_lat, zone.center_lng];
        return (
          <Fragment key={zone.id}>
            {zone.radius_meters ? (
              <Circle
                center={position}
                radius={zone.radius_meters}
                pathOptions={{
                  color: zone.is_active ? "#6c2f00" : "#877369",
                  fillColor: zone.is_active ? "#6c2f00" : "#877369",
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
            ) : null}
            <Marker
              position={position}
              icon={icons.zone}
              eventHandlers={{
                click: () => onZoneMarkerClick?.(zone.id),
              }}
            >
              <Popup>
                <strong>{zone.name}</strong>
                <br />
                {zone.is_active ? "Zona activa" : "Zona inactiva"}
              </Popup>
            </Marker>
          </Fragment>
        );
      })}

      {pickupPoints.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={point.status === "abierto" ? icons.pickupOpen : icons.pickupClosed}
          eventHandlers={{
            click: () => onPickupMarkerClick?.(point.id),
          }}
        >
          <Popup>
            <strong>{point.name}</strong>
            <br />
            {point.status === "abierto" ? "Abierto" : "Cerrado"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default DeliveryZonesMap;
