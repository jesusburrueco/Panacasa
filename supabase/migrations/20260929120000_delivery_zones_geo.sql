-- Coordenadas de referencia para representar cada zona de reparto en el mapa
-- (Leaflet/OpenStreetMap). El circulo se dibuja con centro (lat, lng) y radio
-- en metros; son opcionales porque una zona puede definirse solo por codigos
-- postales sin una posicion en el mapa todavia.
alter table public.delivery_zones
  add column if not exists center_lat double precision,
  add column if not exists center_lng double precision,
  add column if not exists radius_meters integer;

comment on column public.delivery_zones.center_lat is 'Latitud del centro de la zona para mostrarla en el mapa.';
comment on column public.delivery_zones.center_lng is 'Longitud del centro de la zona para mostrarla en el mapa.';
comment on column public.delivery_zones.radius_meters is 'Radio en metros del circulo de cobertura mostrado en el mapa.';
