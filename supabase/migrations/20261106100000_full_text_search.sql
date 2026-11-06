-- Stage 5: full-text search (German) + search log

-- 1. The search vector --------------------------------------------------------------------------
-- A tsvector is a pre-processed version of a text: words reduced to their stem ("Drucker",
-- "Druckern" → "druck"), stop words ("der", "nicht", "ich"…) removed, positions stored.
-- Searching it is far faster than scanning the raw text.
alter table public.articles add column search_vector tsvector;

-- Weights decide how much a hit counts: A (title) > B (tags, summary) > C (body).
-- The trigger keeps the column current on every insert/update, whichever client writes.
create or replace function public.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only the view counter changed? Then don't touch updated_at ("Aktualisiert am" = content change).
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'updated_at' - 'view_count' - 'search_vector')
         is not distinct from (to_jsonb(old) - 'updated_at' - 'view_count' - 'search_vector') then
    new.updated_at := old.updated_at;
    return new;
  end if;

  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  new.search_vector :=
    setweight(to_tsvector('german', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('german',
      coalesce(array_to_string(new.tags, ' '), '') || ' ' || coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(new.content, '')), 'C');

  return new;
end;
$$;

-- Fill the vector for articles that already exist.
update public.articles set search_vector =
  setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(content, '')), 'C');

-- GIN = "Generalized Inverted Index": for every word it stores the list of rows containing it,
-- like the index at the back of a book. This is what makes `@@` matches fast.
create index articles_search_vector_idx on public.articles using gin (search_vector);

-- 2. Search function ----------------------------------------------------------------------------
-- websearch_to_tsquery turns what people type into a query and never throws a syntax error
-- (it understands "quoted phrases", -excluded words and "or").
-- By default it ANDs all words. For natural questions ("ich komme nicht in meinen PC rein")
-- that is too strict, so unless the user used search operators we OR the words and let the
-- ranking put the articles that match the most (and most important) words first.
--
-- Runs as the CALLING user (default SECURITY INVOKER), so RLS still applies.
create function public.search_articles(p_query text, p_limit integer default 20)
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
  q tsquery;
begin
  q := websearch_to_tsquery('german', p_query);

  if p_query !~ '(^|\s)-|"|(^|\s)or(\s|$)' then
    q := replace(q::text, ' & ', ' | ')::tsquery;
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

revoke execute on function public.search_articles(text, integer) from public, anon;
grant  execute on function public.search_articles(text, integer) to authenticated;

-- 3. Search log -----------------------------------------------------------------------------------
-- Every search is stored. Later this answers "what do people look for?" and, with
-- results_count = 0, "which article is missing?" (dashboard, stage 8).
create table public.search_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid default auth.uid() references public.profiles (id) on delete set null,
  query              text not null check (char_length(query) between 1 and 300),
  results_count      integer not null default 0,
  clicked_article_id uuid references public.articles (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index search_logs_created_at_idx on public.search_logs (created_at desc);

alter table public.search_logs enable row level security;

-- You can write and read your own entries; agents/admins can read all (statistics).
create policy "search_logs_insert_own"
  on public.search_logs for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "search_logs_select_own_or_staff"
  on public.search_logs for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- After a click we store which article was opened – and nothing else may be changed later.
create policy "search_logs_update_own_click"
  on public.search_logs for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke update on public.search_logs from authenticated;
grant  update (clicked_article_id) on public.search_logs to authenticated;
