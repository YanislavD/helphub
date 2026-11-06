-- Stage 6 follow-up: less noise in search results.
--
-- Findings from testing with real queries (see conversation / docs):
--  1. Common words ("bleibt", "kein"…) matched many articles and flooded the keyword side.
--  2. The embedding model (gte-small, English-centric) gives German texts similarities that all lie
--     in a narrow band (~0.80–0.87), so a semantic hit alone is weak evidence.
-- Fixes: ignore very common query words, and only let weakly supported hits through when they are at
-- the very top of their list. The hybrid function now also reports WHERE a hit came from (keyword
-- list, semantic list, or both) so the UI can show an honest relevance level.

-- 1. Keyword search: drop query words that occur in many articles ----------------------------------
-- A word that appears in >30 % of the articles says nothing about the topic (like "stop words" learned
-- from our own data). Only applied once there are enough articles for the statistic to mean something.
create or replace function public.search_articles(p_query text, p_limit integer default 20)
returns table (
  id            uuid,
  title         text,
  slug          text,
  summary       text,
  view_count    integer,
  updated_at    timestamptz,
  published_at  timestamptz,
  category_id   uuid,
  category_name text,
  category_slug text,
  rank          real
)
language plpgsql
stable
set search_path = ''
as $$
declare
  q          tsquery;
  total      integer;
  lex        text;
  df         integer;
  kept       text[] := '{}';
  all_terms  text[] := '{}';
begin
  q := websearch_to_tsquery('german', p_query);

  -- Natural question (no search operators): OR the words, rank decides.
  if p_query !~ '(^|\s)-|"|(^|\s)or(\s|$)' then
    select count(*) into total from public.articles a where a.status = 'published';

    for lex in select (regexp_matches(q::text, '''([^'']+)''', 'g'))[1] loop
      all_terms := all_terms || quote_literal(lex);
      select count(*) into df
      from public.articles a
      where a.status = 'published' and a.search_vector @@ quote_literal(lex)::tsquery;

      if total < 10 or df * 100 <= total * 30 then
        kept := kept || quote_literal(lex);
      end if;
    end loop;

    -- If every word was "common", keep them all rather than searching for nothing.
    if cardinality(kept) = 0 then
      kept := all_terms;
    end if;

    if cardinality(kept) > 0 then
      q := array_to_string(kept, ' | ')::tsquery;
    end if;
  end if;

  -- Only stop words ("ich nicht der") → nothing to search for.
  if numnode(q) = 0 then
    return;
  end if;

  return query
    select a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at, a.published_at,
           a.category_id, c.name, c.slug,
           ts_rank_cd(a.search_vector, q, 1)::real
    from public.articles a
    join public.categories c on c.id = a.category_id
    where a.status = 'published'
      and a.search_vector @@ q
    order by ts_rank_cd(a.search_vector, q, 1) desc, a.view_count desc
    limit greatest(1, least(p_limit, 50));
end;
$$;

-- 2. Hybrid search: report the origin of each hit and gate weak ones --------------------------------
-- Return type changes (two new columns), so the function must be dropped first.
drop function public.hybrid_search_articles(text, extensions.vector, integer, integer, double precision, double precision);

create function public.hybrid_search_articles(
  p_query              text,
  p_embedding          extensions.vector(384),
  p_limit              integer default 20,
  p_rrf_k              integer default 60,
  p_min_similarity     double precision default 0.80,
  p_relative_margin    double precision default 0.06,
  p_sem_only_max_rank  integer default 3,   -- a hit found ONLY by meaning must be in the top N of that list
  p_fts_only_max_rank  integer default 8    -- a hit found ONLY by keywords must be in the top N of that list
)
returns table (
  id            uuid,
  title         text,
  slug          text,
  summary       text,
  view_count    integer,
  updated_at    timestamptz,
  published_at  timestamptz,
  category_id   uuid,
  category_name text,
  category_slug text,
  rank          real,
  similarity    real,
  fts_rank      integer,   -- position in the keyword list (null = not found by keywords)
  sem_rank      integer    -- position in the semantic list (null = not found by meaning)
)
language sql
stable
set search_path = ''
as $$
  with fts as (
    select s.id, row_number() over (order by s.rank desc) as r
    from public.search_articles(p_query, 50) s
  ),
  sem as (
    select m.article_id as id, max(m.similarity) as sim
    from public.match_article_chunks(p_embedding, 60, p_min_similarity) m
    group by m.article_id
  ),
  sem_ranked as (
    select s.id, s.sim, row_number() over (order by s.sim desc) as r
    from sem s
    where s.sim >= (select max(sim) from sem) - p_relative_margin
  ),
  fused as (
    select coalesce(f.id, s.id) as id,
           f.r as fts_r,
           s.r as sem_r,
           coalesce(1.0 / (p_rrf_k + f.r), 0) + coalesce(1.0 / (p_rrf_k + s.r), 0) as score,
           s.sim
    from fts f
    full outer join sem_ranked s on s.id = f.id
  )
  select a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at, a.published_at,
         a.category_id, c.name, c.slug,
         fused.score::real,
         fused.sim::real,
         fused.fts_r::integer,
         fused.sem_r::integer
  from fused
  join public.articles a on a.id = fused.id and a.status = 'published'
  join public.categories c on c.id = a.category_id
  where (fused.fts_r is not null and fused.sem_r is not null)
     or (fused.sem_r is not null and fused.sem_r <= p_sem_only_max_rank)
     or (fused.fts_r is not null and fused.fts_r <= p_fts_only_max_rank)
  order by fused.score desc, a.view_count desc
  limit greatest(1, least(p_limit, 50))
$$;

revoke execute on function public.hybrid_search_articles(text, extensions.vector, integer, integer, double precision, double precision, integer, integer) from public, anon;
grant  execute on function public.hybrid_search_articles(text, extensions.vector, integer, integer, double precision, double precision, integer, integer) to authenticated;
