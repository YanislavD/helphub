-- Stage 6: semantic (AI) search with pgvector + hybrid ranking
--
-- Idea: an embedding model turns a text into a vector of 384 numbers – its "meaning". Texts
-- with similar meaning get vectors that point in similar directions, even without sharing words
-- ("ich komme nicht in den PC" ≈ "Passwort zurücksetzen"). pgvector stores those vectors in
-- Postgres and finds the nearest ones.

-- 1. Extension ---------------------------------------------------------------------------------
-- Supabase convention: extensions live in their own schema, not in `public`.
create extension if not exists vector with schema extensions;

-- 2. Chunks ------------------------------------------------------------------------------------
-- An article is split into small chunks (~900 characters), each with its own vector. The embedding
-- model only sees ~512 tokens, and a vector for a whole long article would blur all topics together.
create table public.article_chunks (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references public.articles (id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  embedding   extensions.vector(384) not null,   -- gte-small produces 384 dimensions
  created_at  timestamptz not null default now(),
  unique (article_id, chunk_index)
);

-- HNSW = a graph index for "nearest neighbours". cosine ops = we compare the angle between vectors,
-- the right measure for normalised embeddings.
create index article_chunks_embedding_idx
  on public.article_chunks using hnsw (embedding extensions.vector_cosine_ops);

alter table public.article_chunks enable row level security;

-- Reading: only chunks of articles the user may see (the subquery is itself subject to the
-- articles policies). Writing: NO policy for users – only the Edge Function writes chunks, using
-- the service role key, which bypasses RLS.
create policy "article_chunks_select_visible_articles"
  on public.article_chunks for select to authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));

-- 3. Nearest chunks ---------------------------------------------------------------------------------
-- `<=>` is pgvector's cosine DISTANCE (0 = identical, 2 = opposite); similarity = 1 - distance.
create function public.match_article_chunks(
  query_embedding      extensions.vector(384),
  match_count          integer default 20,
  similarity_threshold double precision default 0.0
)
returns table (chunk_id uuid, article_id uuid, content text, similarity double precision)
language sql
stable
set search_path = ''
as $$
  select c.id,
         c.article_id,
         c.content,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.article_chunks c
  join public.articles a on a.id = c.article_id and a.status = 'published'
  where 1 - (c.embedding operator(extensions.<=>) query_embedding) > similarity_threshold
  order by c.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 200)
$$;

revoke execute on function public.match_article_chunks(extensions.vector, integer, double precision) from public, anon;
grant  execute on function public.match_article_chunks(extensions.vector, integer, double precision) to authenticated;

-- 4. Hybrid search (Reciprocal Rank Fusion) -------------------------------------------------------
-- We have two ranked lists: keyword search (stage 5) and semantic search. Their scores live on
-- different scales and can't be added. RRF ignores the scores and only uses the POSITIONS:
--     score(article) = 1/(k + position in list A) + 1/(k + position in list B)
-- An article that is high in both lists wins; one that is high in only one list still shows up.
-- k = 60 is the usual constant; it softens the gap between rank 1 and rank 2.
--
-- Tuning knobs (so no code redeploy is needed to change behaviour):
--   p_min_similarity   absolute floor for semantic hits. gte-small similarities are compressed
--                      (unrelated texts often score ~0.75–0.80), so the floor must be high.
--   p_relative_margin  semantic hits must be within this distance of the BEST semantic hit.
create function public.hybrid_search_articles(
  p_query           text,
  p_embedding       extensions.vector(384),
  p_limit           integer default 20,
  p_rrf_k           integer default 60,
  p_min_similarity  double precision default 0.80,
  p_relative_margin double precision default 0.06
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
  similarity    real
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
           coalesce(1.0 / (p_rrf_k + f.r), 0) + coalesce(1.0 / (p_rrf_k + s.r), 0) as score,
           s.sim
    from fts f
    full outer join sem_ranked s on s.id = f.id
  )
  select a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at, a.published_at,
         a.category_id, c.name, c.slug,
         fused.score::real,
         fused.sim::real
  from fused
  join public.articles a on a.id = fused.id and a.status = 'published'
  join public.categories c on c.id = a.category_id
  order by fused.score desc, a.view_count desc
  limit greatest(1, least(p_limit, 50))
$$;

revoke execute on function public.hybrid_search_articles(text, extensions.vector, integer, integer, double precision, double precision) from public, anon;
grant  execute on function public.hybrid_search_articles(text, extensions.vector, integer, integer, double precision, double precision) to authenticated;
