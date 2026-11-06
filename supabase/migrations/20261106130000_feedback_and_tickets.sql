-- Stage 7: article feedback, support tickets (+ attachments in Storage)

-- 1. Article feedback ---------------------------------------------------------------------------
-- One vote per user per article (the unique constraint), but it can be changed later (upsert).
create table public.article_feedback (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  helpful    boolean not null,
  comment    text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, user_id)
);

create index article_feedback_article_idx on public.article_feedback (article_id);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger article_feedback_touch
  before update on public.article_feedback
  for each row execute function public.touch_updated_at();

alter table public.article_feedback enable row level security;

-- You see and manage your own vote; agents/admins can read everything (comments help improve articles).
create policy "feedback_select_own_or_staff"
  on public.article_feedback for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

create policy "feedback_insert_own"
  on public.article_feedback for insert to authenticated
  with check (
    user_id = (select auth.uid())
    -- only for articles you are allowed to see (published, or any for staff)
    and exists (select 1 from public.articles a where a.id = article_id)
  );

create policy "feedback_update_own"
  on public.article_feedback for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "feedback_delete_own"
  on public.article_feedback for delete to authenticated
  using (user_id = (select auth.uid()));

-- Aggregated numbers for everyone ("91 % found this helpful"), without exposing who voted what.
create function public.article_feedback_stats(p_article_id uuid)
returns table (helpful_count bigint, total_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) filter (where f.helpful), count(*)
  from public.article_feedback f
  join public.articles a on a.id = f.article_id and a.status = 'published'
  where f.article_id = p_article_id
$$;

revoke execute on function public.article_feedback_stats(uuid) from public, anon;
grant  execute on function public.article_feedback_stats(uuid) to authenticated;

-- The same for ALL articles at once – for the agent article list and the dashboard (staff only).
create function public.article_feedback_summary()
returns table (article_id uuid, helpful_count bigint, total_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return query
    select f.article_id, count(*) filter (where f.helpful), count(*)
    from public.article_feedback f
    group by f.article_id;
end;
$$;

revoke execute on function public.article_feedback_summary() from public, anon;
grant  execute on function public.article_feedback_summary() to authenticated;

-- 2. Tickets ------------------------------------------------------------------------------------------
-- Temporary table until a separate ticket system exists (project plan). `source_query` remembers what
-- the person searched for, so the IT team sees the failed search that led to the ticket.
create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.ticket_status   as enum ('open', 'in_progress', 'done');

create table public.ticket_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title             text not null check (char_length(btrim(title)) between 5 and 150),
  description       text not null check (char_length(btrim(description)) between 10 and 4000),
  priority          public.ticket_priority not null default 'normal',
  source_query      text check (char_length(source_query) <= 300),
  source_article_id uuid references public.articles (id) on delete set null,
  attachment_path   text,
  status            public.ticket_status not null default 'open',
  created_at        timestamptz not null default now()
);

create index ticket_requests_user_idx    on public.ticket_requests (user_id, created_at desc);
create index ticket_requests_status_idx  on public.ticket_requests (status);

alter table public.ticket_requests enable row level security;

create policy "tickets_select_own_or_staff"
  on public.ticket_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- You can only create tickets for yourself, always starting as "open", and an attachment path must
-- point into your own folder.
create policy "tickets_insert_own"
  on public.ticket_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'open'
    and (attachment_path is null or attachment_path like (select auth.uid())::text || '/%')
  );

-- Only staff move tickets through their lifecycle.
create policy "tickets_update_staff"
  on public.ticket_requests for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- 3. Attachments: private Storage bucket --------------------------------------------------------------
-- A bucket is like a folder of files with its own rules. `public = false` means files can only be
-- fetched with a signed, expiring URL. The limits are enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments', 'ticket-attachments', false,
  10485760,  -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- Files are stored as  <user id>/<ticket id>/<file name>. Policies on storage.objects work like RLS:
-- the first path segment must be the caller's own user id.
create policy "attachments_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ticket-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_select_own_or_staff"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_staff())
  );

-- Allows cleaning up an upload when creating the ticket failed afterwards.
create policy "attachments_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
