-- Stage 3: categories and articles (+ Row Level Security)

-- 1. Helper: is the current user an agent or admin? ------------------------------------------
-- Reuses current_user_role() from stage 2 so every policy stays one readable line.
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('agent', 'admin'), false)
$$;

-- 2. Categories -------------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,      -- URL-friendly id, e.g. "netzwerk-vpn"
  icon       text not null default 'file-text',  -- icon name, mapped to a component in the frontend
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Everyone who is signed in may read categories; only admins may change them.
create policy "categories_select_authenticated"
  on public.categories for select to authenticated
  using (true);

create policy "categories_insert_admin"
  on public.categories for insert to authenticated
  with check (public.current_user_role() = 'admin');

create policy "categories_update_admin"
  on public.categories for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "categories_delete_admin"
  on public.categories for delete to authenticated
  using (public.current_user_role() = 'admin');

-- Reference data the app needs from day one (not demo content).
insert into public.categories (name, slug, icon, sort_order) values
  ('Netzwerk & VPN',      'netzwerk-vpn',       'globe',      1),
  ('Drucker',             'drucker',            'printer',    2),
  ('Konten & Passwörter', 'konten-passwoerter', 'lock',       3),
  ('Software',            'software',           'app-window', 4),
  ('Hardware',            'hardware',           'monitor',    5),
  ('E-Mail & Teams',      'email-teams',        'mail',       6)
on conflict (slug) do nothing;

-- 3. Articles ---------------------------------------------------------------------------------
create type public.article_status as enum ('draft', 'published');

create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(btrim(title)) between 3 and 200),
  slug         text not null unique,
  summary      text not null default '',
  content      text not null default '',          -- Markdown
  category_id  uuid not null references public.categories (id) on delete restrict,
  tags         text[] not null default '{}',
  status       public.article_status not null default 'draft',
  author_id    uuid references public.profiles (id) on delete set null,
  view_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz                         -- set automatically the first time it is published
);

create index articles_category_id_idx on public.articles (category_id);
create index articles_status_idx      on public.articles (status);

-- Keeps updated_at / published_at correct no matter which client writes the row.
create function public.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger articles_before_write
  before insert or update on public.articles
  for each row execute function public.articles_before_write();

-- 4. Row Level Security for articles ---------------------------------------------------------
alter table public.articles enable row level security;

-- Employees only see published articles; agents and admins see everything (drafts too).
create policy "articles_select_published_or_staff"
  on public.articles for select to authenticated
  using (status = 'published' or public.is_staff());

-- Only staff may write, and a new article must be attributed to the person creating it.
create policy "articles_insert_staff"
  on public.articles for insert to authenticated
  with check (public.is_staff() and author_id = (select auth.uid()));

create policy "articles_update_staff"
  on public.articles for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "articles_delete_staff"
  on public.articles for delete to authenticated
  using (public.is_staff());
