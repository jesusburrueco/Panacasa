-- Planes semanales configurables desde el admin: dias de reparto concretos,
-- barras por dia (1-3) y precio semanal. Para mas de 3 barras diarias el
-- cliente contacta directamente (plan personalizado, fuera de esta tabla).
alter table public.subscription_plans
  add column if not exists delivery_days_of_week text[] not null default '{}',
  add column if not exists breads_per_day integer not null default 1,
  add column if not exists weekly_price_cents integer;

alter table public.subscription_plans
  drop constraint if exists subscription_plans_breads_per_day_check,
  add constraint subscription_plans_breads_per_day_check
    check (breads_per_day between 1 and 3),
  drop constraint if exists subscription_plans_weekly_price_cents_check,
  add constraint subscription_plans_weekly_price_cents_check
    check (weekly_price_cents is null or weekly_price_cents >= 0),
  drop constraint if exists subscription_plans_delivery_days_of_week_check,
  add constraint subscription_plans_delivery_days_of_week_check
    check (
      delivery_days_of_week <@ array[
        'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
      ]::text[]
    );

comment on column public.subscription_plans.delivery_days_of_week is 'Dias de reparto del plan (lunes..domingo, sin tildes).';
comment on column public.subscription_plans.breads_per_day is 'Barras entregadas cada dia de reparto (1, 2 o 3).';
comment on column public.subscription_plans.weekly_price_cents is 'Precio semanal del plan en centimos de euro.';

-- Los planes semanales existentes ya expresan su precio por semana.
update public.subscription_plans
set weekly_price_cents = price_cents
where weekly_price_cents is null and delivery_frequency = 'semanal';
