-- Dias de la semana en los que cada cliente quiere recibir su pan. Los
-- albaranes diarios se calculan exclusivamente a partir de esta columna
-- (no de subscription_plans.delivery_days_of_week).
alter table public.profiles
  add column if not exists delivery_days text[];

alter table public.profiles
  drop constraint if exists profiles_delivery_days_check,
  add constraint profiles_delivery_days_check
    check (
      delivery_days is null
      or delivery_days <@ array[
        'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
      ]::text[]
    );

comment on column public.profiles.delivery_days is 'Dias de entrega elegidos por el cliente (lunes..domingo, sin tildes).';

-- Acelera el filtro "clientes con entrega este dia" del albaran.
create index if not exists profiles_delivery_days_idx on public.profiles using gin (delivery_days);
