-- Perfiles de usuario: extienden auth.users con datos de contacto y entrega.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

comment on table public.profiles is 'Perfil extendido de cada usuario autenticado.';
comment on column public.profiles.role is 'Nivel de acceso: user (suscriptor) o admin (panel de administracion).';

create index if not exists profiles_delivery_zone_id_idx on public.profiles (delivery_zone_id);
create index if not exists profiles_role_idx on public.profiles (role);

-- Crea automaticamente un perfil cuando se registra un nuevo usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impide que un usuario se autoasigne el rol de administrador.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not exists (
       select 1 from public.profiles where id = auth.uid() and role = 'admin'
     )
  then
    raise exception 'Solo un administrador puede cambiar el rol de un perfil';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_escalation on public.profiles;
create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- Helper de autorizacion reutilizado por las políticas RLS de todas las tablas.
-- security definer evita la recursion de RLS al consultar la propia tabla profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
