-- RLS regression test for profiles, categories and articles.
--
-- HOW TO RUN: paste the whole file into the Supabase SQL Editor and press Run.
-- It creates three throw-away users (user / agent / admin), acts as each of them and checks
-- what the policies allow. Everything happens inside a transaction that is ROLLED BACK at
-- the end, so no data is left behind. If a check fails you get an error naming the check.
-- Success looks like:  NOTICE: ALL RLS CHECKS PASSED

begin;

do $$
declare
  u_user  uuid := gen_random_uuid();
  u_agent uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  cat_id  uuid;
  pub_id  uuid;
  n       integer;
begin
  -- Arrange (as the database owner, RLS does not apply) ---------------------------------
  insert into auth.users (id, email) values
    (u_user,  'rls-user@test.local'),
    (u_agent, 'rls-agent@test.local'),
    (u_admin, 'rls-admin@test.local');            -- the trigger creates the profiles
  update public.profiles set role = 'agent' where id = u_agent;
  update public.profiles set role = 'admin' where id = u_admin;

  select id into cat_id from public.categories order by sort_order limit 1;
  insert into public.articles (title, slug, category_id, status, author_id)
    values ('RLS published', 'rls-published', cat_id, 'published', u_agent) returning id into pub_id;
  insert into public.articles (title, slug, category_id, status, author_id)
    values ('RLS draft', 'rls-draft', cat_id, 'draft', u_agent);

  -- Act as an EMPLOYEE (role "user") -------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_user, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.articles where slug like 'rls-%';
  assert n = 1, 'employee must see only the published article, saw ' || n;

  begin
    insert into public.articles (title, slug, category_id, author_id) values ('Nope', 'rls-nope', cat_id, u_user);
    assert false, 'employee must NOT be able to create articles';
  exception when insufficient_privilege then null; end;

  update public.articles set title = 'Hacked' where id = pub_id;
  get diagnostics n = row_count;
  assert n = 0, 'employee must NOT be able to update articles';

  delete from public.articles where id = pub_id;
  get diagnostics n = row_count;
  assert n = 0, 'employee must NOT be able to delete articles';

  begin
    update public.profiles set role = 'admin' where id = u_user;
    assert false, 'employee must NOT be able to promote themselves';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.categories (name, slug) values ('Evil', 'evil');
    assert false, 'employee must NOT be able to create categories';
  exception when insufficient_privilege then null; end;

  select count(*) into n from public.profiles;
  assert n = 1, 'employee must see only their own profile, saw ' || n;

  -- Act as an AGENT -------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_agent, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.articles where slug like 'rls-%';
  assert n = 2, 'agent must see published AND draft articles, saw ' || n;

  insert into public.articles (title, slug, category_id, author_id) values ('Agent article', 'rls-agent', cat_id, u_agent);

  begin
    insert into public.articles (title, slug, category_id, author_id) values ('Spoofed', 'rls-spoof', cat_id, u_admin);
    assert false, 'agent must NOT be able to create articles in somebody else''s name';
  exception when insufficient_privilege then null; end;

  update public.articles set title = 'Edited by agent' where id = pub_id;
  get diagnostics n = row_count;
  assert n = 1, 'agent must be able to update articles';

  begin
    insert into public.categories (name, slug) values ('Evil', 'evil');
    assert false, 'agent must NOT be able to create categories';
  exception when insufficient_privilege then null; end;

  begin
    update public.profiles set role = 'admin' where id = u_agent;
    assert false, 'agent must NOT be able to promote themselves';
  exception when insufficient_privilege then null; end;

  delete from public.articles where slug = 'rls-agent';
  get diagnostics n = row_count;
  assert n = 1, 'agent must be able to delete articles';

  -- Act as an ADMIN -------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.categories (name, slug) values ('Admin category', 'rls-admin-cat');

  update public.profiles set role = 'agent' where id = u_user;
  get diagnostics n = row_count;
  assert n = 1, 'admin must be able to change roles';

  select count(*) into n from public.profiles where id in (u_user, u_agent, u_admin);
  assert n = 3, 'admin must see all profiles, saw ' || n;

  reset role;
  raise notice 'ALL RLS CHECKS PASSED';
end
$$;

rollback;
