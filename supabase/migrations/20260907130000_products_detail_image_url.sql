-- Foto de detalle/corte de la miga, ademas de la foto principal existente.
alter table public.products
  add column if not exists detail_image_url text;

comment on column public.products.image_url is 'Foto principal del pan, usada en la card del catalogo.';
comment on column public.products.detail_image_url is 'Foto del corte o detalle de la miga del pan.';
