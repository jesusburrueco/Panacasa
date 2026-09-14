-- Catalogo de panes disponibles para suscripcion.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  ingredients text,
  nutritional_info jsonb,
  category text,
  tags text[] not null default '{}',
  price_cents integer not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_price_cents_check check (price_cents >= 0)
);

comment on table public.products is 'Catalogo de panes artesanales.';
comment on column public.products.category is 'Categoria del pan, p.ej. masa madre, integral, especial.';
comment on column public.products.tags is 'Etiquetas dieteticas, p.ej. {vegano,"sin gluten"}.';
comment on column public.products.price_cents is 'Precio unitario en centimos de euro.';

create index if not exists products_category_idx on public.products (category);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_tags_idx on public.products using gin (tags);
