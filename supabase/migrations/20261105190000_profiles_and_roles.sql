-- Stage 2: user profiles, roles and Row Level Security
--
-- Supabase stores logins in the private `auth.users` table. We can't (and shouldn't) add our
-- own columns there, so every user gets a matching row in `public.profiles` that holds the
-- app data: display name and role.

-- 1. Roles ---------------------------------------------------------------------------------
create type public.user_role as enum ('user', 'agent', 'admin');

-- 2. Profiles table ------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'App data for every auth user: display name and role.';

-- 3. Helper: role of the current user --------------------------------------------------------
-- SECURITY DEFINER = runs with the owner's rights and therefore skips RLS. We need that because
-- a policy on `profiles` that itself selects from `profiles` would trigger the same policy again
-- (infinite recursion). Empty search_path is a hardening rule for definer functions.
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

-- 4. Trigger: create the profile automatically on sign-up -----------------------------------
-- The role is NOT read from the sign-up metadata (users control that!). Everyone starts as 'user';
-- only an admin can promote someone later.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody should be able to call the trigger function through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Users that signed up before this migration get a profile too.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

-- 5. Row Level Security ----------------------------------------------------------------------
-- With RLS enabled and no policy, nobody can do anything. Every policy below *opens* one door.
alter table public.profiles enable row level security;

-- Read: your own profile; admins can read everyone (user management screen).
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.current_user_role() = 'admin');

-- Update (own): you may edit your own profile, but the new row must keep your current role,
-- so nobody can promote themselves.
create policy "profiles_update_own_without_role_change"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.current_user_role());

-- Update (admin): admins may change any profile, including roles.
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- No INSERT or DELETE policies on purpose: rows are created by the trigger above and
-- removed automatically (ON DELETE CASCADE) when the auth user is deleted.
