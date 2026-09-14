-- Row Level Security para todas las tablas del esquema.
-- public.is_admin() se define en 20260730120100_profiles.sql y evita
-- recursion de RLS al consultar la propia tabla profiles (security definer).

-- ---------------------------------------------------------------------------
-- delivery_zones: lectura publica de zonas activas, escritura solo admin.
-- ---------------------------------------------------------------------------
alter table public.delivery_zones enable row level security;

create policy "Delivery zones are viewable by everyone"
  on public.delivery_zones for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert delivery zones"
  on public.delivery_zones for insert
  with check (public.is_admin());

create policy "Admins can update delivery zones"
  on public.delivery_zones for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete delivery zones"
  on public.delivery_zones for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- profiles: cada usuario ve y edita su propio perfil; los admins ven todos.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- products: lectura publica de productos activos, escritura solo admin.
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscription_plans: lectura publica de planes activos, escritura solo admin.
-- ---------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;

create policy "Subscription plans are viewable by everyone"
  on public.subscription_plans for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert subscription plans"
  on public.subscription_plans for insert
  with check (public.is_admin());

create policy "Admins can update subscription plans"
  on public.subscription_plans for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete subscription plans"
  on public.subscription_plans for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions: cada usuario gestiona sus propias suscripciones; admin, todas.
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can create their own subscriptions"
  on public.subscriptions for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users can update their own subscriptions"
  on public.subscriptions for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Admins can delete subscriptions"
  on public.subscriptions for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscription_items: siguen los permisos de la suscripcion a la que pertenecen.
-- ---------------------------------------------------------------------------
alter table public.subscription_items enable row level security;

create policy "Users can view items of their own subscriptions"
  on public.subscription_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "Users can add items to their own subscriptions"
  on public.subscription_items for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "Users can update items of their own subscriptions"
  on public.subscription_items for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "Users can remove items from their own subscriptions"
  on public.subscription_items for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- deliveries: los usuarios solo consultan las suyas; solo el admin programa
-- y actualiza el estado logistico de las entregas.
-- ---------------------------------------------------------------------------
alter table public.deliveries enable row level security;

create policy "Users can view deliveries of their own subscriptions"
  on public.deliveries for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "Admins can insert deliveries"
  on public.deliveries for insert
  with check (public.is_admin());

create policy "Admins can update deliveries"
  on public.deliveries for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete deliveries"
  on public.deliveries for delete
  using (public.is_admin());
