-- Puntos de entrega: urbanizaciones dentro de una zona de reparto (barrio),
-- colocados por el admin haciendo click en el mapa. Solo reparto a domicilio:
-- no tiene relacion con la antigua tabla pickup_points (en desuso).
create table if not exists public.delivery_points (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references public.delivery_zones (id) on delete set null,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  constraint delivery_points_lat_check check (lat between -90 and 90),
  constraint delivery_points_lng_check check (lng between -180 and 180)
);

comment on table public.delivery_points is 'Urbanizaciones de entrega dentro de cada zona, ubicadas en el mapa.';

create index if not exists delivery_points_zone_id_idx on public.delivery_points (zone_id);

alter table public.delivery_points enable row level security;

create policy "Admins can view delivery points"
  on public.delivery_points for select
  using (public.is_admin());

create policy "Admins can insert delivery points"
  on public.delivery_points for insert
  with check (public.is_admin());

create policy "Admins can update delivery points"
  on public.delivery_points for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete delivery points"
  on public.delivery_points for delete
  using (public.is_admin());
