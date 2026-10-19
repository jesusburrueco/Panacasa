-- Carrito de productos sueltos (fuera de la suscripcion) y pedidos extra que
-- se entregan junto al reparto de la suscripcion en la fecha indicada.
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  constraint cart_items_quantity_check check (quantity > 0),
  constraint cart_items_user_product_key unique (user_id, product_id)
);

create table if not exists public.extra_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  status text not null default 'pending',
  total_cents integer not null,
  delivery_date date not null,
  created_at timestamptz not null default now(),
  constraint extra_orders_status_check
    check (status in ('pending', 'delivered', 'cancelled')),
  constraint extra_orders_total_cents_check check (total_cents >= 0)
);

create table if not exists public.extra_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.extra_orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null,
  price_cents integer not null,
  constraint extra_order_items_quantity_check check (quantity > 0),
  constraint extra_order_items_price_cents_check check (price_cents >= 0)
);

comment on column public.extra_order_items.price_cents is 'Precio unitario del producto en el momento del pedido.';

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);
create index if not exists extra_orders_delivery_date_idx on public.extra_orders (delivery_date, status);
create index if not exists extra_orders_user_id_idx on public.extra_orders (user_id);
create index if not exists extra_order_items_order_id_idx on public.extra_order_items (order_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.cart_items enable row level security;

create policy "Users manage their own cart"
  on public.cart_items for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

alter table public.extra_orders enable row level security;

create policy "Users can view their own extra orders"
  on public.extra_orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can create their own pending extra orders"
  on public.extra_orders for insert
  with check ((user_id = auth.uid() and status = 'pending') or public.is_admin());

-- El cliente solo puede borrar su pedido mientras este pendiente (se usa
-- para deshacer un pedido si fallan sus lineas). El resto, el admin.
create policy "Users can delete their own pending extra orders"
  on public.extra_orders for delete
  using ((user_id = auth.uid() and status = 'pending') or public.is_admin());

create policy "Admins can update extra orders"
  on public.extra_orders for update
  using (public.is_admin())
  with check (public.is_admin());

alter table public.extra_order_items enable row level security;

create policy "Users can view items of their own extra orders"
  on public.extra_order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.extra_orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Users can add items to their own pending extra orders"
  on public.extra_order_items for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.extra_orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'pending'
    )
  );

create policy "Admins can modify extra order items"
  on public.extra_order_items for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete extra order items"
  on public.extra_order_items for delete
  using (public.is_admin());
