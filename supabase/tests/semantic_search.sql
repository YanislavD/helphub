-- Regression test for the vector side of search: article_chunks, match_article_chunks and the
-- hybrid (RRF) function. It uses hand-made vectors instead of the real model so the expected
-- outcome is known exactly:  e1 = [1,0,0,…]  e2 = [0,1,0,…]  (cosine similarity e1·e1 = 1, e1·e2 = 0).
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run. Everything is rolled back at the end.
-- Success looks like:  NOTICE: ALL SEMANTIC SEARCH CHECKS PASSED
-- (Run the migration 20261106110000_semantic_search.sql first.)

begin;

create function pg_temp.unit_vec(n integer) returns extensions.vector
language sql as $$
  select ('[' || string_agg(case when i = n then '1' else '0' end, ',') || ']')::extensions.vector
  from generate_series(1, 384) i
$$;

do $$
declare
  u_me   uuid := gen_random_uuid();
  cat_id uuid;
  a_id   uuid;
  b_id   uuid;
  d_id   uuid;
  e1     extensions.vector := pg_temp.unit_vec(1);
  e2     extensions.vector := pg_temp.unit_vec(2);
  n      integer;
  top    text;
begin
  -- Arrange (as owner) -------------------------------------------------------------------------
  insert into auth.users (id, email) values (u_me, 'semantic-me@test.local');
  select id into cat_id from public.categories order by sort_order limit 1;

  insert into public.articles (title, slug, content, category_id, status) values
    ('Alpha Anleitung', 'sem-a', 'Inhalt alpha', cat_id, 'published') returning id into a_id;
  insert into public.articles (title, slug, content, category_id, status) values
    ('Beta Zebrastreifen', 'sem-b', 'Inhalt beta', cat_id, 'published') returning id into b_id;
  insert into public.articles (title, slug, content, category_id, status) values
    ('Gamma Entwurf', 'sem-d', 'Inhalt gamma', cat_id, 'draft') returning id into d_id;

  insert into public.article_chunks (article_id, chunk_index, content, embedding) values
    (a_id, 0, 'alpha', e1),
    (b_id, 0, 'beta',  e2),
    (d_id, 0, 'gamma', e1);   -- same meaning as alpha, but a DRAFT

  -- Act as an employee ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_me, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Nearest chunks: only the published article with the same direction, never the draft.
  select count(*) into n from public.match_article_chunks(e1, 10, 0.5);
  assert n = 1, 'only the published, similar chunk may match, got ' || n;

  select a.title into top
  from public.match_article_chunks(e1, 10, 0.5) m join public.articles a on a.id = m.article_id;
  assert top = 'Alpha Anleitung', 'wrong article matched: ' || coalesce(top, 'none');

  -- Hybrid, semantic only: the query text matches no keyword, the vector points at alpha.
  select title into top from public.hybrid_search_articles('qqqxyz', e1, 10) limit 1;
  assert top = 'Alpha Anleitung', 'semantic-only hit expected, got ' || coalesce(top, 'none');

  -- Hybrid, keyword only: the vector matches nothing above the floor, the keyword finds beta.
  select title into top from public.hybrid_search_articles('Zebrastreifen', pg_temp.unit_vec(3), 10) limit 1;
  assert top = 'Beta Zebrastreifen', 'keyword-only hit expected, got ' || coalesce(top, 'none');

  -- Hybrid, both: keyword → beta, vector → alpha. Both must be returned.
  select count(*) into n from public.hybrid_search_articles('Zebrastreifen', e1, 10);
  assert n = 2, 'keyword AND semantic hits must both appear, got ' || n;

  -- Drafts never appear, whatever the vector says.
  select count(*) into n from public.hybrid_search_articles('Entwurf', e1, 10) where slug = 'sem-d';
  assert n = 0, 'draft must never be returned';

  -- Employees cannot write chunks (only the Edge Function can, with the service role).
  begin
    insert into public.article_chunks (article_id, chunk_index, content, embedding) values (a_id, 1, 'evil', e1);
    assert false, 'employee must NOT be able to insert chunks';
  exception when insufficient_privilege then null; end;

  delete from public.article_chunks where article_id = a_id;
  get diagnostics n = row_count;
  assert n = 0, 'employee must NOT be able to delete chunks';

  reset role;
  raise notice 'ALL SEMANTIC SEARCH CHECKS PASSED';
end
$$;

rollback;
