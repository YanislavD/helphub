-- Stage 4: employee portal – view counter, category counts, author names

-- 1. Don't bump `updated_at` when only the view counter changes ------------------------------
-- "Updated on …" on an article should mean the *content* changed, not that someone read it.
create or replace function public.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'updated_at' - 'view_count')
         is not distinct from (to_jsonb(old) - 'updated_at' - 'view_count') then
    new.updated_at := old.updated_at;
    return new;
  end if;

  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- 2. View counter as an RPC (remote procedure call) --------------------------------------------
-- Employees have no UPDATE right on articles (and must not get one – they could edit content).
-- This function runs with its owner's rights (SECURITY DEFINER) but can do exactly one thing:
-- add 1 to the counter of a *published* article.
create function public.increment_article_views(p_article_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.articles
  set view_count = view_count + 1
  where id = p_article_id and status = 'published'
$$;

revoke execute on function public.increment_article_views(uuid) from public, anon;
grant  execute on function public.increment_article_views(uuid) to authenticated;

-- 3. Number of published articles per category (for the category cards) ----------------------
-- Counted as the owner so the number is the same for everyone (agents would otherwise also
-- count their drafts through RLS).
create function public.published_article_counts()
returns table (category_id uuid, article_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.category_id, count(*)
  from public.articles a
  where a.status = 'published'
  group by a.category_id
$$;

revoke execute on function public.published_article_counts() from public, anon;
grant  execute on function public.published_article_counts() to authenticated;

-- 4. Author names ----------------------------------------------------------------------------
-- Employees may not read `profiles` (RLS), but an article should show who wrote it.
-- This exposes ONLY id + name of agents/admins – nothing else (no e-mail, no role).
create function public.author_names(p_ids uuid[])
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name
  from public.profiles p
  where p.id = any (p_ids) and p.role in ('agent', 'admin')
$$;

revoke execute on function public.author_names(uuid[]) from public, anon;
grant  execute on function public.author_names(uuid[]) to authenticated;
