-- Suscripciones activas de cada usuario a un plan.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  stripe_subscription_id text unique,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  constraint subscriptions_status_check
    check (status in ('active', 'paused', 'cancelled', 'past_due'))
);

comment on table public.subscriptions is 'Suscripcion de un usuario a un plan de reparto de pan.';
comment on column public.subscriptions.stripe_subscription_id is 'Identificador de la Subscription correspondiente en Stripe.';

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
