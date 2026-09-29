-- Puntos de recogida: ubicaciones fisicas (obradores, puntos de entrega)
-- que se muestran como marcadores en el mapa de logistica del admin.
create table if not exists public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  status text not null default 'abierto',
  created_at timestamptz not null default now(),
  constraint pickup_points_status_check check (status in ('abierto', 'cerrado'))
);

comment on table public.pickup_points is 'Puntos de recogida fisicos, ubicados por coordenadas en el mapa.';
comment on column public.pickup_points.status is 'Estado operativo del punto: abierto o cerrado.';

create index if not exists pickup_points_zone_id_idx on public.pickup_points (zone_id);
create index if not exists pickup_points_status_idx on public.pickup_points (status);

-- ---------------------------------------------------------------------------
-- pickup_points: lectura publica de puntos abiertos, escritura solo admin.
-- ---------------------------------------------------------------------------
alter table public.pickup_points enable row level security;

create policy "Pickup points are viewable by everyone"
  on public.pickup_points for select
  using (status = 'abierto' or public.is_admin());

create policy "Admins can insert pickup points"
  on public.pickup_points for insert
  with check (public.is_admin());

create policy "Admins can update pickup points"
  on public.pickup_points for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete pickup points"
  on public.pickup_points for delete
  using (public.is_admin());
