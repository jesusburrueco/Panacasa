-- Entregas programadas para cada suscripcion.
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  delivery_zone_id uuid not null references public.delivery_zones (id) on delete restrict,
  scheduled_date date not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  constraint deliveries_status_check
    check (status in ('pending', 'in_transit', 'delivered', 'failed'))
);

comment on table public.deliveries is 'Entregas programadas y su estado logistico.';

create index if not exists deliveries_subscription_id_idx on public.deliveries (subscription_id);
create index if not exists deliveries_delivery_zone_id_idx on public.deliveries (delivery_zone_id);
create index if not exists deliveries_status_idx on public.deliveries (status);
create index if not exists deliveries_scheduled_date_idx on public.deliveries (scheduled_date);
