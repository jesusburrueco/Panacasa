-- Politicas de Storage para el bucket "products" (fotos de panes).
-- El bucket ya existe y esta marcado como publico: eso solo afecta a las
-- descargas directas por URL, la escritura sigue pasando por RLS sobre
-- storage.objects igual que cualquier otra tabla.

create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and public.is_admin());

create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'products' and public.is_admin());
