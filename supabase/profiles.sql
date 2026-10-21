-- Run this file in the Supabase SQL Editor. Existing tables are kept as-is.
create table if not exists public.profiles (
  id uuid not null,
  email text not null,
  first_name text not null,
  last_name text not null,
  gender text not null,
  birthday date not null,
  favorite_s text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_birthday_check check (birthday < current_date),
  constraint profiles_first_name_check check (char_length(first_name) >= 2),
  constraint profiles_gender_check check (gender = any (array['male'::text, 'female'::text, 'other'::text])),
  constraint profiles_last_name_check check (char_length(last_name) >= 2)
);

alter table public.profiles
  add column if not exists favorite_s text[] not null default '{}'::text[];

create table if not exists public.profile_genres (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  genre text not null check (char_length(genre) > 0),
  created_at timestamptz not null default now(),
  constraint profile_genres_pkey primary key (profile_id, genre)
);

alter table public.profile_genres enable row level security;
drop policy if exists "Users can read their own genres" on public.profile_genres;
create policy "Users can read their own genres" on public.profile_genres
  for select to authenticated using ((select auth.uid()) = profile_id);
drop policy if exists "Users can manage their own genres" on public.profile_genres;
create policy "Users can manage their own genres" on public.profile_genres
  for all to authenticated using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

-- Copies validated signup metadata into the profiles table for each Auth user.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, gender, birthday, favorite_s)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'gender',
    (new.raw_user_meta_data ->> 'birthday')::date,
    array(
      select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'genres', '[]'::jsonb))
    )
  );
  insert into public.profile_genres (profile_id, genre)
  select new.id, genre
  from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'genres', '[]'::jsonb)) as selected_genres(genre)
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
