-- Repartidores: personal que realiza las rutas de reparto.
create table if not exists public.delivery_workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.delivery_workers is 'Repartidores que ejecutan las rutas de reparto diarias.';

create index if not exists delivery_workers_is_active_idx on public.delivery_workers (is_active);

alter table public.delivery_workers enable row level security;

create policy "Admins can view delivery workers"
  on public.delivery_workers for select
  using (public.is_admin());

create policy "Admins can insert delivery workers"
  on public.delivery_workers for insert
  with check (public.is_admin());

create policy "Admins can update delivery workers"
  on public.delivery_workers for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete delivery workers"
  on public.delivery_workers for delete
  using (public.is_admin());
