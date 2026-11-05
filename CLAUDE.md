# HelpHub – IT Self-Service Portal с AI търсене

## За проекта
HelpHub е база знания (Knowledge Base) за IT поддръжка във фирма. Служителите описват проблема си с обикновени думи и получават подходяща статия с решение. Ако статията не помогне, могат да създадат тикет.

Проектът е за портфолио (кандидатстване за IT Support / Helpdesk / Junior Developer в Германия). Демо фирмата е фиктивна: **Müller Logistik GmbH**.

Разработчикът учи по време на проекта: обяснявай накратко какво правиш и защо, особено при нови концепции (RLS, embeddings, pgvector, Edge Functions).

## Основни правила
- **Само безплатни инструменти и услуги** – без пробни версии и без платени API ключове (без OpenAI и др.).
- Работим **етап по етап** (виж по-долу). Не започвай следващ етап, преди текущият да работи и да е тестван.
- След всеки завършен етап: commit с ясно съобщение (Conventional Commits: `feat:`, `fix:`, `chore:`...).
- Никога не commit-вай тайни. Ключовете са в `.env.local`, в репото има само `.env.example`.
- `service_role` ключът се ползва **само** в Edge Functions, никога във frontend-а.
- UI текстовете са на **немски**. Кодът, имената и коментарите са на английски.
- Преди промяна по базата: SQL миграция в `supabase/migrations/`.

## Стек
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query
- **Markdown:** редактор с преглед (напр. `@uiw/react-md-editor`), рендиране с `react-markdown`
- **Backend:** Supabase – Postgres, Auth, Storage, Edge Functions (Deno)
- **AI търсене:** вграденият модел `gte-small` в Supabase Edge Functions (`new Supabase.ai.Session('gte-small')`, `mean_pool: true`, `normalize: true`) → вектори с 384 измерения, съхранявани с `pgvector`
- **Тестове:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions (lint, тестове, build), deploy на Netlify

## Дизайн
- Тъмна тема по подразбиране, модерен и изчистен вид (качествен UI, не базов шаблон)
- Цветовете като CSS променливи / Tailwind тема, лесни за смяна
- Адаптивен дизайн (телефон и desktop)
- Ясни състояния: зареждане (skeleton), празно, грешка

## Роли
| Роля | Права |
|------|-------|
| `user` (служител) | търси и чете публикувани статии, дава обратна връзка, създава тикет |
| `agent` | + създава и редактира статии, вижда статистики |
| `admin` | + управлява категории и роли на потребители |

## База данни
- `profiles` – `id` (= auth.users.id), `full_name`, `role` (`user` / `agent` / `admin`), `created_at`
- `categories` – `id`, `name`, `slug`, `icon`, `sort_order`
- `articles` – `id`, `title`, `slug`, `summary`, `content` (Markdown), `category_id`, `tags` (text[]), `status` (`draft` / `published`), `author_id`, `view_count`, `created_at`, `updated_at`, `search_vector` (tsvector за full-text)
- `article_chunks` – `id`, `article_id`, `chunk_index`, `content`, `embedding` (vector(384))
- `article_feedback` – `id`, `article_id`, `user_id`, `helpful` (boolean), `comment`, `created_at`
- `search_logs` – `id`, `user_id`, `query`, `results_count`, `clicked_article_id`, `created_at`
- `ticket_requests` – `id`, `user_id`, `title`, `description`, `source_query`, `status`, `created_at` (временно, докато се свърже с отделната тикет система)

### Row Level Security (задължително на всички таблици)
- `user` вижда само статии със `status = 'published'`
- `agent` / `admin` виждат и редактират всички статии
- всеки вижда и създава само своите feedback, search_logs и ticket_requests
- само `admin` променя роли и категории

### Функции в базата
- `match_article_chunks(query_embedding, match_count, similarity_threshold)` – векторно търсене (cosine)
- hybrid търсене: комбинирай резултатите от full-text и векторното търсене (напр. Reciprocal Rank Fusion)

## Структура
```
src/
  components/     # общи UI компоненти
  features/
    auth/
    articles/
    search/
    feedback/
    tickets/
    dashboard/
  lib/            # supabase клиент, помощни функции
  pages/
  types/
supabase/
  migrations/
  functions/
    embed-article/   # създава embeddings при запазване на статия
    search/          # embedding на въпроса + hybrid търсене
  seed.sql
```

## Етапи

### Етап 1: Основа
- [ ] Vite + React + TS + Tailwind, ESLint, Prettier
- [ ] Supabase проект и клиент, `.env.example`
- [ ] Тъмна тема, основен layout (header, навигация), рутинг
- [ ] GitHub repo, `.gitignore`

### Етап 2: Вход и роли
- [ ] Регистрация и вход със Supabase Auth
- [ ] Таблица `profiles` + trigger, който я попълва при регистрация (роля по подразбиране `user`)
- [ ] Защитени страници според ролята

### Етап 3: Статии (CRUD)
- [ ] Миграции за `categories` и `articles` + RLS
- [ ] Админ панел: списък, създаване, редакция, изтриване
- [ ] Markdown редактор с преглед, категории, тагове, чернова/публикувана

### Етап 4: Портал за служителите
- [ ] Начална страница с голямо поле „Beschreibe dein Problem“
- [ ] Категории, популярни и нови статии
- [ ] Страница на статия (Markdown, брояч на прегледи)

### Етап 5: Класическо търсене
- [ ] `search_vector` + GIN индекс, full-text търсене (немска конфигурация `german`)
- [ ] Страница с резултати, записване в `search_logs`

### Етап 6: AI търсене
- [ ] `pgvector` разширение, таблица `article_chunks`, индекс
- [ ] Edge Function `embed-article`: разделя статията на части и създава embeddings при всяко запазване/публикуване
- [ ] Edge Function `search`: embedding на въпроса + hybrid търсене
- [ ] Тест с неточни въпроси („ich komme nicht in den PC“ → нулиране на парола)

### Етап 7: Обратна връзка и тикети
- [ ] „War dieser Artikel hilfreich?“ 👍/👎 + коментар
- [ ] Ако не помогне: бутон „Ticket erstellen“, формата се попълва с текста от търсенето
- [ ] (по-късно) връзка с отделната тикет система и „Ticket in Artikel umwandeln“

### Етап 8: Dashboard за агенти
- [ ] Най-търсени теми
- [ ] Търсения без резултат (= липсващи статии)
- [ ] Най-полезни и най-неполезни статии, прегледи по категория

### Етап 9: Качество и публикуване
- [ ] Тестове (Vitest) за основните части
- [ ] GitHub Actions: lint, тестове, build при push и pull request
- [ ] Deploy на Netlify
- [ ] `seed.sql` с демо категории, статии и акаунти (user / agent / admin)
- [ ] README на **немски**: описание, скрийншоти, архитектура, демо акаунти, как се стартира локално

## След етапите
Добавяне на 25–40 статии за типични Helpdesk проблеми (пароли, принтери, VPN, Outlook, Teams, мрежа, споделени папки, хардуер) и тестване на точността на AI търсенето.
