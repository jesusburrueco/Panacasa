-- profiles.email: copia del email de auth.users, para poder listar el
-- directorio de suscriptores sin depender de la API admin de auth
-- (auth.admin.listUsers), que requiere SUPABASE_SERVICE_ROLE_KEY y no es
-- consultable via RLS/PostgREST normal.
alter table public.profiles
  add column if not exists email text;

comment on column public.profiles.email is 'Copia de auth.users.email, sincronizada al crear el perfil.';

-- Mantiene el email sincronizado para los perfiles ya existentes.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- A partir de ahora, el trigger de alta de usuario tambien copia el email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
