-- Regression test for the admin tools: user list access, category management rights and the
-- "last admin" protection.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run (after migration 20261106150000).
-- Everything is rolled back at the end. Success looks like:  NOTICE: ALL ADMIN CHECKS PASSED

begin;

do $$
declare
  u_emp   uuid := gen_random_uuid();
  u_agent uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  cat_id  uuid;
  n       integer;
begin
  -- Arrange --------------------------------------------------------------------------------------------
  insert into auth.users (id, email) values
    (u_emp,   'adm-emp@test.local'),
    (u_agent, 'adm-agent@test.local'),
    (u_admin, 'adm-admin@test.local');
  update public.profiles set role = 'agent' where id = u_agent;
  update public.profiles set role = 'admin' where id = u_admin;

  -- Employee and agent must not see the user list ---------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_emp, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform * from public.admin_list_users();
    assert false, 'employee must NOT list users';
  exception when insufficient_privilege then null; end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_agent, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform * from public.admin_list_users();
    assert false, 'agent must NOT list users';
  exception when insufficient_privilege then null; end;

  -- Categories: agents cannot change them ----------------------------------------------------------------
  begin
    insert into public.categories (name, slug) values ('Agent category', 'adm-agent-cat');
    assert false, 'agent must NOT create categories';
  exception when insufficient_privilege then null; end;

  -- Admin: list works, categories can be managed -----------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.admin_list_users() where email = 'adm-emp@test.local';
  assert n = 1, 'admin must see users with their e-mail address';

  insert into public.categories (name, slug, icon, sort_order) values ('Admin category', 'adm-cat', 'shield', 99)
    returning id into cat_id;
  update public.categories set name = 'Renamed' where id = cat_id;
  get diagnostics n = row_count;
  assert n = 1, 'admin must be able to rename a category';
  delete from public.categories where id = cat_id;
  get diagnostics n = row_count;
  assert n = 1, 'admin must be able to delete an empty category';

  -- Admin may change another user's role ----------------------------------------------------------------------
  update public.profiles set role = 'agent' where id = u_emp;
  get diagnostics n = row_count;
  assert n = 1, 'admin must be able to change roles';

  -- The last admin is protected --------------------------------------------------------------------------------
  reset role;
  -- demote every OTHER admin (as owner; allowed because "our" test admin still exists)
  update public.profiles set role = 'user' where role = 'admin' and id <> u_admin;

  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profiles set role = 'user' where id = u_admin;
    assert false, 'the last admin must NOT be demotable';
  exception when raise_exception then
    assert sqlerrm like '%at least one admin%', 'unexpected error: ' || sqlerrm;
  end;

  reset role;
  raise notice 'ALL ADMIN CHECKS PASSED';
end
$$;

rollback;
