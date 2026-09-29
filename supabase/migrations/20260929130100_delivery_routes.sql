-- Rutas de reparto: asignan un repartidor a una zona para una fecha concreta.
create table if not exists public.delivery_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  worker_id uuid references public.delivery_workers (id) on delete set null,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_date date not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  constraint delivery_routes_status_check
    check (status in ('pending', 'in_progress', 'completed'))
);

comment on table public.delivery_routes is 'Rutas de reparto: repartidor + zona + fecha, con su estado.';

create index if not exists delivery_routes_worker_id_idx on public.delivery_routes (worker_id);
create index if not exists delivery_routes_zone_id_idx on public.delivery_routes (zone_id);
create index if not exists delivery_routes_delivery_date_idx on public.delivery_routes (delivery_date);

alter table public.delivery_routes enable row level security;

create policy "Admins can view delivery routes"
  on public.delivery_routes for select
  using (public.is_admin());

create policy "Admins can insert delivery routes"
  on public.delivery_routes for insert
  with check (public.is_admin());

create policy "Admins can update delivery routes"
  on public.delivery_routes for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete delivery routes"
  on public.delivery_routes for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- deliveries: columnas para vincular con la ruta y detallar portal/piso,
-- necesarias para generar el albaran de produccion y reparto.
-- ---------------------------------------------------------------------------
alter table public.deliveries
  add column if not exists route_id uuid references public.delivery_routes (id) on delete set null,
  add column if not exists address_detail text,
  add column if not exists portal text,
  add column if not exists floor text;

comment on column public.deliveries.route_id is 'Ruta de reparto (repartidor + zona + fecha) asignada a esta entrega.';
comment on column public.deliveries.address_detail is 'Direccion completa de referencia para esta entrega.';
comment on column public.deliveries.portal is 'Portal dentro de la urbanizacion/zona.';
comment on column public.deliveries.floor is 'Piso/puerta dentro del portal.';

create index if not exists deliveries_route_id_idx on public.deliveries (route_id);

-- Evita duplicar la entrega del dia si "Generar albaran" se pulsa mas de una vez.
create unique index if not exists deliveries_subscription_scheduled_date_key
  on public.deliveries (subscription_id, scheduled_date);
