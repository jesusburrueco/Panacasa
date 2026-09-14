-- Zonas de reparto: cobertura postal y dias de entrega disponibles.
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  postal_codes text[] not null default '{}',
  delivery_days text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.delivery_zones is 'Zonas de reparto definidas por codigos postales y dias de entrega.';
comment on column public.delivery_zones.postal_codes is 'Codigos postales cubiertos por la zona.';
comment on column public.delivery_zones.delivery_days is 'Dias de la semana en los que se reparte, p.ej. {lunes,miercoles}.';

create index if not exists delivery_zones_is_active_idx on public.delivery_zones (is_active);
create index if not exists delivery_zones_postal_codes_idx on public.delivery_zones using gin (postal_codes);
