-- Stage 8: numbers for the agent dashboard
--
-- All functions are SECURITY DEFINER because they aggregate over data that single users must not see
-- (everybody's searches, every vote). The first thing each one does is check is_staff(): the function
-- itself is the access control, nobody but agents/admins gets a result.
--
-- SQL aggregation in a nutshell: GROUP BY collapses many rows into one per group, and aggregate
-- functions (count, sum, avg, max) summarise each group; FILTER (WHERE …) counts only some rows.

-- Small helper so that every function raises the same error for non-staff.
create function public.assert_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.assert_staff() from public, anon;
grant  execute on function public.assert_staff() to authenticated;

-- 1. KPI numbers: current period vs. the period of the same length before it -----------------------
create function public.dashboard_overview(p_days integer default 30)
returns table (
  searches           bigint,
  searches_prev      bigint,
  clicked            bigint,   -- searches where the person opened a result
  clicked_prev       bigint,
  open_tickets       bigint,
  new_tickets        bigint,
  published_articles bigint,
  draft_articles     bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days       integer     := greatest(1, least(coalesce(p_days, 30), 365));
  v_since      timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
  v_prev_since timestamptz := now() - make_interval(days => 2 * greatest(1, least(coalesce(p_days, 30), 365)));
begin
  perform public.assert_staff();

  return query
  select
    (select count(*) from public.search_logs l where l.created_at >= v_since),
    (select count(*) from public.search_logs l where l.created_at >= v_prev_since and l.created_at < v_since),
    (select count(*) from public.search_logs l where l.created_at >= v_since and l.clicked_article_id is not null),
    (select count(*) from public.search_logs l where l.created_at >= v_prev_since and l.created_at < v_since
                                                  and l.clicked_article_id is not null),
    (select count(*) from public.ticket_requests t where t.status <> 'done'),
    (select count(*) from public.ticket_requests t where t.created_at >= v_since),
    (select count(*) from public.articles a where a.status = 'published'),
    (select count(*) from public.articles a where a.status = 'draft');
end;
$$;

-- 2. Searches per day (every day appears, also those without searches) -------------------------------
create function public.dashboard_search_timeseries(p_days integer default 30)
returns table (day date, searches bigint, without_results bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days  integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_today date    := (now() at time zone 'Europe/Berlin')::date;
begin
  perform public.assert_staff();

  return query
  select d::date,
         count(l.id),
         count(l.id) filter (where l.results_count = 0)
  from generate_series(v_today - (v_days - 1), v_today, interval '1 day') d
  left join public.search_logs l on (l.created_at at time zone 'Europe/Berlin')::date = d::date
  group by d
  order by d;
end;
$$;

-- 3. Most frequent searches --------------------------------------------------------------------------------
create function public.dashboard_top_queries(p_days integer default 30, p_limit integer default 8)
returns table (term text, searches bigint, clicks bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_staff();

  return query
  select lower(btrim(l.query)),
         count(*),
         count(l.clicked_article_id)
  from public.search_logs l
  where l.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  group by lower(btrim(l.query))
  order by count(*) desc, max(l.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 8), 50));
end;
$$;

-- 4. Searches without a fitting result = articles that are missing ---------------------------------
-- "results_count" is the number of STRONG hits (the app logs it that way since stage 8), so 0 means
-- "we had nothing convincing to offer".
create function public.dashboard_unanswered_queries(p_days integer default 30, p_limit integer default 8)
returns table (term text, searches bigint, last_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_staff();

  return query
  select lower(btrim(l.query)),
         count(*),
         max(l.created_at)
  from public.search_logs l
  where l.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
    and l.results_count = 0
  group by lower(btrim(l.query))
  order by count(*) desc, max(l.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 8), 50));
end;
$$;

-- 5. Helpfulness per article (best and worst are the two ends of this list) --------------------------
create function public.dashboard_article_ratings(p_min_votes integer default 1)
returns table (
  article_id    uuid,
  title         text,
  slug          text,
  helpful_count bigint,
  total_count   bigint,
  rate          numeric   -- percent helpful
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_staff();

  return query
  select a.id,
         a.title,
         a.slug,
         count(*) filter (where f.helpful),
         count(*),
         round(100.0 * count(*) filter (where f.helpful) / count(*), 0)
  from public.article_feedback f
  join public.articles a on a.id = f.article_id and a.status = 'published'
  group by a.id, a.title, a.slug
  having count(*) >= greatest(1, coalesce(p_min_votes, 1))
  order by 6 desc, 5 desc, a.title;
end;
$$;

-- 6. Views per category ------------------------------------------------------------------------------------
create function public.dashboard_views_by_category()
returns table (category_id uuid, name text, slug text, views bigint, articles bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_staff();

  return query
  select c.id,
         c.name,
         c.slug,
         coalesce(sum(a.view_count) filter (where a.status = 'published'), 0)::bigint,
         count(a.id) filter (where a.status = 'published')
  from public.categories c
  left join public.articles a on a.category_id = c.id
  group by c.id, c.name, c.slug, c.sort_order
  order by 4 desc, c.sort_order;
end;
$$;

-- Permissions: callable by signed-in users – the staff check inside decides what they get. -----------
do $$
declare
  f text;
begin
  foreach f in array array[
    'dashboard_overview(integer)',
    'dashboard_search_timeseries(integer)',
    'dashboard_top_queries(integer, integer)',
    'dashboard_unanswered_queries(integer, integer)',
    'dashboard_article_ratings(integer)',
    'dashboard_views_by_category()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant  execute on function public.%s to authenticated', f);
  end loop;
end
$$;
