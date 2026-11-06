-- Regression test for the dashboard functions: access control and the numbers they return.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run (after migration 20261106140000).
-- Everything happens in a transaction that is ROLLED BACK at the end.
-- Success looks like:  NOTICE: ALL DASHBOARD CHECKS PASSED

begin;

do $$
declare
  u_emp   uuid := gen_random_uuid();
  u_agent uuid := gen_random_uuid();
  u_v1    uuid := gen_random_uuid();
  u_v2    uuid := gen_random_uuid();
  cat_id  uuid;
  art_id  uuid;
  before_searches bigint;
  before_clicked  bigint;
  n       integer;
  r       record;
begin
  -- Arrange (as owner) ------------------------------------------------------------------------
  insert into auth.users (id, email) values
    (u_emp,   'dash-emp@test.local'),
    (u_agent, 'dash-agent@test.local'),
    (u_v1,    'dash-v1@test.local'),
    (u_v2,    'dash-v2@test.local');
  update public.profiles set role = 'agent' where id = u_agent;

  select id into cat_id from public.categories order by sort_order limit 1;
  insert into public.articles (title, slug, content, category_id, status)
    values ('Dash article', 'dash-art', 'x', cat_id, 'published') returning id into art_id;

  -- Measure the baseline first, so the test also works on a database that already has data.
  perform set_config('request.jwt.claims', json_build_object('sub', u_agent, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select o.searches, o.clicked into before_searches, before_clicked from public.dashboard_overview(30) o;
  reset role;

  -- 3 searches today (1 clicked, 1 without result), 1 old search outside the 30 days
  insert into public.search_logs (user_id, query, results_count, clicked_article_id, created_at) values
    (null, 'dash drucker', 2, art_id, now()),
    (null, 'Dash Drucker ', 2, null,   now()),             -- same term, different case/spaces
    (null, 'dash kaffee',  0, null,   now()),
    (null, 'dash alt',     1, null,   now() - interval '60 days');

  insert into public.article_feedback (article_id, user_id, helpful) values
    (art_id, u_v1, true),
    (art_id, u_v2, false);

  -- Employee: every dashboard function must refuse -----------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_emp, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin perform * from public.dashboard_overview(30);
    assert false, 'employee must NOT read the overview';
  exception when insufficient_privilege then null; end;
  begin perform * from public.dashboard_search_timeseries(30);
    assert false, 'employee must NOT read the time series';
  exception when insufficient_privilege then null; end;
  begin perform * from public.dashboard_top_queries(30, 5);
    assert false, 'employee must NOT read top queries';
  exception when insufficient_privilege then null; end;
  begin perform * from public.dashboard_unanswered_queries(30, 5);
    assert false, 'employee must NOT read unanswered queries';
  exception when insufficient_privilege then null; end;
  begin perform * from public.dashboard_article_ratings(1);
    assert false, 'employee must NOT read article ratings';
  exception when insufficient_privilege then null; end;
  begin perform * from public.dashboard_views_by_category();
    assert false, 'employee must NOT read views by category';
  exception when insufficient_privilege then null; end;

  -- Agent: numbers ---------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_agent, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select * into r from public.dashboard_overview(30);
  assert r.searches = before_searches + 3, 'overview: expected 3 new searches in the period, got ' || (r.searches - before_searches);
  assert r.clicked  = before_clicked + 1,  'overview: expected 1 new clicked search';
  assert r.published_articles >= 1, 'overview: published articles must be counted';

  select count(*) into n from public.dashboard_search_timeseries(7);
  assert n = 7, 'time series must contain exactly one row per day (7), got ' || n;

  select searches into n from public.dashboard_top_queries(30, 50) where term = 'dash drucker';
  assert n = 2, 'search terms must be grouped case-insensitively and trimmed, got ' || coalesce(n::text, 'null');

  select count(*) into n from public.dashboard_unanswered_queries(30, 50) where term = 'dash kaffee';
  assert n = 1, 'a search with 0 strong results must be listed as unanswered';
  select count(*) into n from public.dashboard_unanswered_queries(30, 50) where term = 'dash drucker';
  assert n = 0, 'a search with results must not be listed as unanswered';
  select count(*) into n from public.dashboard_top_queries(30, 50) where term = 'dash alt';
  assert n = 0, 'searches older than the period must be excluded';

  select * into r from public.dashboard_article_ratings(1) where slug = 'dash-art';
  assert r.total_count = 2 and r.helpful_count = 1 and r.rate = 50, 'ratings: expected 1 of 2 helpful (50 %)';

  perform * from public.dashboard_views_by_category();

  reset role;
  raise notice 'ALL DASHBOARD CHECKS PASSED';
end
$$;

rollback;
