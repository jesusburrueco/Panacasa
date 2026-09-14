-- Panes elegidos dentro de una suscripcion.
create table if not exists public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null default 1,
  constraint subscription_items_quantity_check check (quantity > 0),
  constraint subscription_items_subscription_product_unique unique (subscription_id, product_id)
);

comment on table public.subscription_items is 'Panes y cantidades incluidos en cada suscripcion.';

create index if not exists subscription_items_subscription_id_idx on public.subscription_items (subscription_id);
create index if not exists subscription_items_product_id_idx on public.subscription_items (product_id);
