-- Admin tools: list users (with e-mail) and never lose the last admin.

-- 1. Helper: only admins ----------------------------------------------------------------------------------
create function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.assert_admin() from public, anon;
grant  execute on function public.assert_admin() to authenticated;

-- 2. User list for the admin screen ------------------------------------------------------------------------
-- E-mail addresses and sign-in times live in auth.users, which the app (rightly) cannot read. This function
-- exposes them to admins only, and only the few columns the screen needs.
create function public.admin_list_users()
returns table (
  id              uuid,
  full_name       text,
  email           text,
  role            public.user_role,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();

  return query
  select p.id, p.full_name, u.email::text, p.role, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant  execute on function public.admin_list_users() to authenticated;

-- 3. The last admin can never be demoted --------------------------------------------------------------------
-- Otherwise nobody could manage roles any more (the only way out would be editing the table by hand).
-- A trigger runs inside the database no matter which client sends the update, so the rule cannot be bypassed.
create function public.profiles_keep_one_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and new.role <> 'admin'
     and not exists (select 1 from public.profiles p where p.role = 'admin' and p.id <> old.id) then
    raise exception 'at least one admin must remain' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger profiles_keep_one_admin
  before update of role on public.profiles
  for each row execute function public.profiles_keep_one_admin();
