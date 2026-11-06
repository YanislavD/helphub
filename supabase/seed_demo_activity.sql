-- OPTIONAL demo data for the agent dashboard: ~400 fake searches over the last 30 days, so charts and
-- lists are not empty (for screenshots / the portfolio). Paste into the Supabase SQL Editor and run.
--
-- The rows have user_id = NULL (no real person) so they can be removed again with:
--     delete from public.search_logs where user_id is null;
-- Real searches always carry a user id and are never touched by that statement.

insert into public.search_logs (user_id, query, results_count, clicked_article_id, created_at)
select
  null,
  q.term,
  q.results,
  -- ~70 % of searches that had results end in a click (on a random published article)
  case when q.results > 0 and random() < 0.7
       -- "q.results is not null" only makes the subquery depend on the outer row, so it is evaluated
       -- again for EVERY row (otherwise Postgres would pick one random article for all of them)
       then (select id from public.articles where status = 'published' and q.results is not null
             order by random() limit 1)
  end,
  -- spread over the last 30 days, a bit more on weekdays
  now() - (random() * interval '30 days')
from (
  select terms.term, terms.results
  from (values
    ('vpn verbindet nicht', 2, 14), ('passwort vergessen', 2, 13), ('drucker druckt nicht', 2, 11),
    ('outlook startet nicht', 2, 9), ('kein ton in teams', 2, 8), ('wlan gast', 2, 6),
    ('laptop lädt nicht', 2, 5), ('bildschirm schwarz', 1, 4), ('konto gesperrt', 2, 4),
    -- no fitting article exists for these → they show up as "missing articles"
    ('docking station erkennt monitor nicht', 0, 6), ('scanner ordner zugriff verweigert', 0, 5),
    ('sap anmeldung langsam', 0, 4), ('lagerscanner wlan zugang', 0, 3), ('headset koppeln mac', 0, 2)
  ) as terms(term, results, weight)
  cross join lateral generate_series(1, terms.weight * 3)
) as q;
