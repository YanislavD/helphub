-- Regression test for article feedback, tickets and the attachment bucket policies.
--
-- HOW TO RUN: paste into the Supabase SQL Editor and press Run (after migration 20261106130000).
-- Temporary users/articles/tickets are created inside a transaction that is ROLLED BACK at the end.
-- Success looks like:  NOTICE: ALL FEEDBACK/TICKET CHECKS PASSED

begin;

do $$
declare
  u_me    uuid := gen_random_uuid();
  u_other uuid := gen_random_uuid();
  u_agent uuid := gen_random_uuid();
  cat_id  uuid;
  pub_id  uuid;
  draft_id uuid;
  n       integer;
  h       bigint;
  t       bigint;
begin
  -- Arrange (as owner) -------------------------------------------------------------------------
  insert into auth.users (id, email) values
    (u_me,    'ft-me@test.local'),
    (u_other, 'ft-other@test.local'),
    (u_agent, 'ft-agent@test.local');
  update public.profiles set role = 'agent' where id = u_agent;

  select id into cat_id from public.categories order by sort_order limit 1;
  insert into public.articles (title, slug, content, category_id, status)
    values ('FT published', 'ft-pub', 'x', cat_id, 'published') returning id into pub_id;
  insert into public.articles (title, slug, content, category_id, status)
    values ('FT draft', 'ft-draft', 'x', cat_id, 'draft') returning id into draft_id;

  -- Act as the employee "me" -----------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_me, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Feedback: vote, change vote (upsert), one row only.
  insert into public.article_feedback (article_id, helpful) values (pub_id, true);
  insert into public.article_feedback (article_id, helpful, comment) values (pub_id, false, 'doch nicht')
    on conflict (article_id, user_id) do update set helpful = excluded.helpful, comment = excluded.comment;
  select count(*) into n from public.article_feedback where article_id = pub_id;
  assert n = 1, 'a user must have exactly one vote per article, got ' || n;

  begin
    insert into public.article_feedback (article_id, helpful) values (draft_id, true);
    assert false, 'must NOT be able to vote on a draft article';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.article_feedback (article_id, user_id, helpful) values (pub_id, u_other, true);
    assert false, 'must NOT be able to vote in somebody else''s name';
  exception when insufficient_privilege then null; end;

  -- Tickets: create own, status must be open, cannot spoof user, cannot change afterwards.
  insert into public.ticket_requests (title, description, source_query)
    values ('Drucker kaputt', 'Der Drucker im Lager geht nicht an.', 'drucker geht nicht an');

  begin
    insert into public.ticket_requests (user_id, title, description) values (u_other, 'Fake ticket', 'In fremdem Namen erstellt.');
    assert false, 'must NOT be able to create a ticket for somebody else';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.ticket_requests (title, description, status) values ('Schon erledigt', 'Ich setze es selbst auf done.', 'done');
    assert false, 'must NOT be able to create a ticket that is already done';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.ticket_requests (title, description, attachment_path)
      values ('Fremder Anhang', 'Pfad zeigt in fremden Ordner.', u_other::text || '/x/y.png');
    assert false, 'attachment path must point into the own folder';
  exception when insufficient_privilege then null; end;

  update public.ticket_requests set status = 'done' where title = 'Drucker kaputt';
  get diagnostics n = row_count;
  assert n = 0, 'employee must NOT be able to change ticket status';

  -- Storage: own folder yes, foreign folder no.
  insert into storage.objects (bucket_id, name, owner)
    values ('ticket-attachments', u_me::text || '/t1/screenshot.png', u_me);
  begin
    insert into storage.objects (bucket_id, name, owner)
      values ('ticket-attachments', u_other::text || '/t1/evil.png', u_me);
    assert false, 'must NOT be able to upload into somebody else''s folder';
  exception when insufficient_privilege then null; end;

  -- Act as ANOTHER employee: sees nothing of "me" ----------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_other, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.ticket_requests where title = 'Drucker kaputt';
  assert n = 0, 'other employees must not see my tickets';
  select count(*) into n from public.article_feedback where article_id = pub_id;
  assert n = 0, 'other employees must not see my votes';
  select count(*) into n from storage.objects where bucket_id = 'ticket-attachments' and name like u_me::text || '/%';
  assert n = 0, 'other employees must not see my attachments';

  -- Public statistics are visible to everyone, without exposing individual votes.
  select helpful_count, total_count into h, t from public.article_feedback_stats(pub_id);
  assert t = 1 and h = 0, 'stats must show 1 vote, 0 helpful; got ' || t || '/' || h;

  begin
    perform * from public.article_feedback_summary();
    assert false, 'employee must NOT be able to read the all-articles summary';
  exception when insufficient_privilege then null; end;

  -- Act as an AGENT: sees tickets, votes and attachments, can change ticket status ----------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_agent, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.ticket_requests where title = 'Drucker kaputt';
  assert n = 1, 'agent must see all tickets';
  select count(*) into n from public.article_feedback where article_id = pub_id;
  assert n = 1, 'agent must see all feedback';
  select count(*) into n from storage.objects where bucket_id = 'ticket-attachments' and name like u_me::text || '/%';
  assert n = 1, 'agent must see attachments';

  update public.ticket_requests set status = 'in_progress' where title = 'Drucker kaputt';
  get diagnostics n = row_count;
  assert n = 1, 'agent must be able to change ticket status';

  perform * from public.article_feedback_summary();

  reset role;
  raise notice 'ALL FEEDBACK/TICKET CHECKS PASSED';
end
$$;

rollback;
