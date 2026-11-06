-- Regression test for German full-text search and the search log.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run. It creates temporary users and
-- articles inside a transaction that is ROLLED BACK at the end – nothing stays in your database.
-- Success looks like:  NOTICE: ALL SEARCH CHECKS PASSED

begin;

do $$
declare
  u_me    uuid := gen_random_uuid();
  u_other uuid := gen_random_uuid();
  cat_id  uuid;
  art_id  uuid;
  log_id  uuid;
  n       integer;
  r_title real;
  r_body  real;
begin
  -- Arrange (as the database owner) ---------------------------------------------------------
  insert into auth.users (id, email) values
    (u_me,    'search-me@test.local'),
    (u_other, 'search-other@test.local');
  select id into cat_id from public.categories order by sort_order limit 1;

  insert into public.articles (title, slug, summary, content, category_id, status, tags) values
    ('Drucker druckt nicht', 'st-printer', 'Hilfe bei Druckproblemen',
     'Der Drucker zeigt einen Fehler. Prüfe das Kabel.', cat_id, 'published', '{Hardware}'),
    ('Passwort zurücksetzen', 'st-pw', 'Windows Anmeldung',
     'So setzt du dein Passwort zurück und kommst wieder in den PC.', cat_id, 'published', '{Konto}'),
    ('Netzwerkprobleme lösen', 'st-net', '',
     'Wenn der Drucker im Netzwerk fehlt, prüfe die Verbindung.', cat_id, 'published', '{}'),
    ('Geheimer Entwurf', 'st-draft', '', 'Drucker Drucker Drucker', cat_id, 'draft', '{}');

  select id into art_id from public.articles where slug = 'st-printer';

  -- Act as a normal employee ------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_me, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Stemming: a different word form still finds the article.
  select count(*) into n from public.search_articles('Druckern') where slug = 'st-printer';
  assert n = 1, 'stemming: "Druckern" must find "Drucker druckt nicht"';

  -- Drafts are never returned.
  select count(*) into n from public.search_articles('Drucker') where slug = 'st-draft';
  assert n = 0, 'draft articles must not appear in search results';

  -- Weights: a hit in the title beats a hit only in the body.
  select rank into r_title from public.search_articles('Drucker') where slug = 'st-printer';
  select rank into r_body  from public.search_articles('Drucker') where slug = 'st-net';
  assert r_title > r_body, 'title match must rank higher than body-only match';

  -- A natural question: stop words are ignored, the remaining words (komme, PC) find the article.
  select count(*) into n from public.search_articles('ich komme nicht in meinen PC rein') where slug = 'st-pw';
  assert n = 1, 'natural-language question must find the password article';

  -- Only stop words → empty result, no error.
  select count(*) into n from public.search_articles('ich nicht der');
  assert n = 0, 'stop-word-only query must return nothing';

  -- Search operators: -word excludes, "phrase" matches exactly.
  select count(*) into n from public.search_articles('Drucker -Kabel') where slug = 'st-printer';
  assert n = 0, '-Kabel must exclude the printer article';
  select count(*) into n from public.search_articles('"Passwort zurücksetzen"') where slug = 'st-pw';
  assert n = 1, 'quoted phrase must match';

  -- Garbage input must never raise a syntax error.
  select count(*) into n from public.search_articles('((&&!! ::');
  assert n >= 0, 'garbage input must not crash';

  -- Search log -----------------------------------------------------------------------------------
  insert into public.search_logs (query, results_count) values ('Drucker', 2) returning id into log_id;

  begin
    insert into public.search_logs (user_id, query) values (u_other, 'spoofed');
    assert false, 'must NOT be able to log in somebody else''s name';
  exception when insufficient_privilege then null; end;

  update public.search_logs set clicked_article_id = art_id where id = log_id;
  get diagnostics n = row_count;
  assert n = 1, 'must be able to record the clicked article';

  begin
    update public.search_logs set query = 'tampered' where id = log_id;
    assert false, 'must NOT be able to change the query afterwards';
  exception when insufficient_privilege then null; end;

  -- Someone else cannot see my log entries.
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.search_logs where id = log_id;
  assert n = 0, 'other users must not see my search log';

  reset role;
  raise notice 'ALL SEARCH CHECKS PASSED';
end
$$;

rollback;
