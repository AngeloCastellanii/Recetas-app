-- Recetario · esquema Supabase
-- 1) Crea un proyecto en https://supabase.com
-- 2) SQL Editor → pega este archivo → Run
-- 3) Authentication → Providers → Email → desactiva "Confirm email" (para desarrollo)
-- 4) Copia URL y anon key a .env

-- Perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recetas
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  author_id uuid not null references public.profiles (id) on delete cascade,
  prep_time_minutes integer,
  servings integer,
  image_url text,
  is_courtesy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists recipes_author_title_idx
  on public.recipes (author_id, lower(title));

-- Grupos
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  is_courtesy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists groups_owner_name_idx
  on public.groups (owner_id, lower(name));

-- Relación muchos a muchos
create table if not exists public.recipe_groups (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  primary key (recipe_id, group_id)
);

-- Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.groups enable row level security;
alter table public.recipe_groups enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "recipes_select" on public.recipes;
create policy "recipes_select" on public.recipes
  for select to authenticated using (true);

drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own" on public.recipes
  for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own" on public.recipes
  for delete to authenticated
  using (auth.uid() = author_id);

drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select to authenticated using (true);

drop policy if exists "groups_insert_own" on public.groups;
create policy "groups_insert_own" on public.groups
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "groups_update_own" on public.groups;
create policy "groups_update_own" on public.groups
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "groups_delete_own" on public.groups;
create policy "groups_delete_own" on public.groups
  for delete to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "recipe_groups_select" on public.recipe_groups;
create policy "recipe_groups_select" on public.recipe_groups
  for select to authenticated using (true);

drop policy if exists "recipe_groups_insert" on public.recipe_groups;
create policy "recipe_groups_insert" on public.recipe_groups
  for insert to authenticated
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists "recipe_groups_delete" on public.recipe_groups;
create policy "recipe_groups_delete" on public.recipe_groups
  for delete to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  );

-- Storage para fotos de recetas
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "recipe_images_public_read" on storage.objects;
create policy "recipe_images_public_read" on storage.objects
  for select using (bucket_id = 'recipe-images');

drop policy if exists "recipe_images_upload_own" on storage.objects;
create policy "recipe_images_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recipe_images_update_own" on storage.objects;
create policy "recipe_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recipe_images_delete_own" on storage.objects;
create policy "recipe_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
