-- Planes de suscripcion ofrecidos (Basico, Familiar, Premium, etc.).
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  max_breads integer not null,
  delivery_frequency text not null,
  price_cents integer not null,
  stripe_price_id text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint subscription_plans_max_breads_check check (max_breads > 0),
  constraint subscription_plans_price_cents_check check (price_cents >= 0),
  constraint subscription_plans_delivery_frequency_check
    check (delivery_frequency in ('semanal', 'quincenal', 'mensual'))
);

comment on table public.subscription_plans is 'Planes de suscripcion disponibles.';
comment on column public.subscription_plans.max_breads is 'Cantidad maxima de panes incluidos por entrega.';
comment on column public.subscription_plans.stripe_price_id is 'Identificador del Price correspondiente en Stripe.';

create index if not exists subscription_plans_is_active_idx on public.subscription_plans (is_active);
