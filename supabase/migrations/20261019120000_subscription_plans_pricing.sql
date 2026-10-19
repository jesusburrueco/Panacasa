-- Precios por modalidad (L-V / L-L), promocionales y de lectura comercial
-- por dia. promo_active decide si en la parte publica se muestra el precio
-- regular tachado junto al promocional.
alter table public.subscription_plans
  add column if not exists price_weekdays_cents integer,
  add column if not exists price_full_week_cents integer,
  add column if not exists promo_weekdays_cents integer,
  add column if not exists promo_full_week_cents integer,
  add column if not exists commercial_day_price_cents integer,
  add column if not exists commercial_day_promo_cents integer,
  add column if not exists promo_active boolean not null default false;

comment on column public.subscription_plans.price_weekdays_cents is 'Precio semanal modalidad lunes a viernes, en centimos.';
comment on column public.subscription_plans.price_full_week_cents is 'Precio semanal modalidad lunes a lunes (7 dias), en centimos.';
comment on column public.subscription_plans.promo_weekdays_cents is 'Precio promocional lunes a viernes, en centimos.';
comment on column public.subscription_plans.promo_full_week_cents is 'Precio promocional lunes a lunes, en centimos.';
comment on column public.subscription_plans.commercial_day_price_cents is 'Precio de lectura comercial por dia, en centimos.';
comment on column public.subscription_plans.commercial_day_promo_cents is 'Precio comercial por dia con oferta, en centimos.';
comment on column public.subscription_plans.promo_active is 'Si la promocion esta activa se muestran los precios promo.';

-- El precio semanal existente pasa a ser el precio regular L-V.
update public.subscription_plans
set price_weekdays_cents = weekly_price_cents
where price_weekdays_cents is null and weekly_price_cents is not null;
