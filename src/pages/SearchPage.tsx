import { Search, SearchX, Sparkles, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { ArticleCard } from '@/features/articles/ArticleCard'
import { useCategories } from '@/features/articles/hooks'
import { usePublishedArticles } from '@/features/articles/portal-hooks'
import { useSearch } from '@/features/search/hooks'
import { recordSearchClick } from '@/features/search/search-api'
import { exampleQueries } from '@/lib/categories'
import { cn } from '@/lib/cn'

/**
 * /search?q=…            → ranked full-text search results (stage 5; AI ranking joins in stage 6)
 * /search?category=slug  → browse one category
 * /search                → browse everything
 * Both modes can be combined: results can be narrowed to one category.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const categorySlug = params.get('category') ?? undefined

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  return (
    <div>
      <div className="bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_75%)] px-4 pt-10 pb-2">
        <div className="mx-auto max-w-[1160px] sm:px-6">
          {/* `key` resets the input whenever the URL query changes (back button, example chips…) */}
          <SearchForm key={query} initial={query} onSubmit={(q) => updateParams({ q })} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1160px] px-4 pt-6 pb-20 sm:px-6">
        {query ? (
          <SearchResults
            query={query}
            categorySlug={categorySlug}
            onCategory={(slug) => updateParams({ category: slug })}
          />
        ) : (
          <BrowseArticles categorySlug={categorySlug} />
        )}
      </div>
    </div>
  )
}

function SearchForm({ initial, onSubmit }: { initial: string; onSubmit: (query: string) => void }) {
  const [value, setValue] = useState(initial)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length >= 2) onSubmit(trimmed)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-line-2 bg-raised p-2 pl-4 shadow-card transition focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]"
    >
      <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
      <label htmlFor="search-q" className="sr-only">
        Problem beschreiben
      </label>
      <input
        id="search-q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Beschreibe dein Problem…"
        autoComplete="off"
        className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Eingabe löschen"
          onClick={() => setValue('')}
        >
          <X className="size-4" />
        </Button>
      )}
      <Button type="submit" disabled={value.trim().length < 2}>
        Suchen
      </Button>
    </form>
  )
}

function SearchResults({
  query,
  categorySlug,
  onCategory,
}: {
  query: string
  categorySlug: string | undefined
  onCategory: (slug: string | null) => void
}) {
  const search = useSearch(query)
  const [, setParams] = useSearchParams()

  if (query.length < 2) {
    return <p className="text-sm text-fg-muted">Bitte gib mindestens zwei Zeichen ein.</p>
  }

  if (search.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Suche läuft">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[130px] animate-pulse rounded-lg border bg-hover" />
        ))}
      </div>
    )
  }

  if (search.isError) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-err/30 bg-err-soft p-5 text-sm text-err"
      >
        <span>
          Die Suche ist gerade nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.
        </span>
        <Button variant="secondary" size="sm" onClick={() => void search.refetch()}>
          Erneut versuchen
        </Button>
      </div>
    )
  }

  const { hits, logId, semantic } = search.data

  // Category counts among *all* hits, so the sidebar doesn't change when you pick one.
  const counts = new Map<string, { name: string; slug: string; count: number }>()
  for (const hit of hits) {
    const entry = counts.get(hit.category.slug) ?? { ...hit.category, count: 0 }
    entry.count += 1
    counts.set(hit.category.slug, entry)
  }
  const visible = categorySlug ? hits.filter((h) => h.category.slug === categorySlug) : hits

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-raised px-6 py-14 text-center">
        <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
          <SearchX className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">
          Dazu haben wir noch keine Anleitung
        </h2>
        <p className="max-w-md text-sm text-fg-muted">
          Für „{query}“ gibt es noch keinen passenden Artikel. Probiere andere Worte oder lass das
          IT-Team helfen.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {exampleQueries.slice(0, 3).map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setParams({ q: example })}
              className="inline-flex h-[34px] items-center rounded-full border border-line-2 bg-hover px-3.5 text-[13px] text-fg-muted transition hover:border-accent-line hover:bg-accent-soft hover:text-fg"
            >
              {example}
            </button>
          ))}
        </div>
        <TicketHint className="mt-6 w-full max-w-xl text-left" />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-8">
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 text-sm">
          <span className="text-fg-muted">
            <span className="font-semibold text-fg">
              {visible.length} {visible.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </span>{' '}
            für „{query}“ · sortiert nach Relevanz
          </span>
          {semantic ? (
            <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 text-xs font-medium text-accent-hi">
              <Sparkles className="size-3.5" aria-hidden="true" />
              KI-gestützte Suche
            </span>
          ) : (
            <span className="text-xs text-fg-subtle">
              KI-Suche gerade nicht verfügbar – Suche nach Stichworten
            </span>
          )}
        </div>

        {visible.map((hit, index) => (
          <ArticleCard
            key={hit.id}
            article={hit}
            tier={hit.tier}
            best={index === 0 && !categorySlug && hit.tier !== 'low'}
            onOpen={() => logId && recordSearchClick(logId, hit.id)}
          />
        ))}

        <TicketHint className="mt-2" />
      </main>

      <aside className="flex max-w-[320px] min-w-0 flex-[1_1_240px] flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-raised p-5">
          <span className="text-xs font-medium tracking-wider text-fg-subtle uppercase">
            Kategorie
          </span>
          <div className="-mx-2 flex flex-col gap-0.5">
            <CategoryFilter
              label="Alle"
              count={hits.length}
              active={!categorySlug}
              onClick={() => onCategory(null)}
            />
            {[...counts.values()].map((c) => (
              <CategoryFilter
                key={c.slug}
                label={c.name}
                count={c.count}
                active={categorySlug === c.slug}
                onClick={() => onCategory(c.slug)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-raised p-5">
          <span className="text-xs font-medium tracking-wider text-fg-subtle uppercase">Tipp</span>
          <p className="text-[13px] text-fg-muted">
            Je genauer du das Problem beschreibst, desto besser die Treffer – z. B.{' '}
            <span className="font-medium text-fg">
              „Fehlermeldung beim Anmelden: Passwort abgelaufen“
            </span>
            .
          </p>
        </div>
      </aside>
    </div>
  )
}

function CategoryFilter({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-sm px-2.5 text-sm transition',
        active ? 'bg-hover-2 text-fg' : 'text-fg-muted hover:bg-hover-2 hover:text-fg',
      )}
    >
      <span>{label}</span>
      <span className="text-xs text-fg-subtle tabular-nums">{count}</span>
    </button>
  )
}

/** "Not found what you need? Create a ticket" – the button is enabled in stage 7. */
function TicketHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-line-2 px-6 py-5',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">Nicht gefunden, was du suchst?</span>
        <span className="text-[13px] text-fg-muted">
          Wir übernehmen deine Beschreibung automatisch ins Ticket.
        </span>
      </div>
      <Button variant="secondary" disabled title="Kommt in Etappe 7">
        Ticket erstellen
      </Button>
    </div>
  )
}

/** Stage-4 behaviour: browse published articles, optionally of one category. */
function BrowseArticles({ categorySlug }: { categorySlug: string | undefined }) {
  const categories = useCategories()
  const articles = usePublishedArticles({ order: 'new', categorySlug, limit: 50 })
  const category = categories.data?.find((c) => c.slug === categorySlug)

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <div className="mb-2 flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.028em]">
          {category ? category.name : 'Alle Artikel'}
        </h1>
        <p className="text-sm text-fg-muted">
          {articles.data ? `${articles.data.length} Artikel` : 'Wird geladen…'}
        </p>
      </div>

      {articles.isPending &&
        Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-lg border bg-hover" />
        ))}

      {articles.data?.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}

      {articles.isError && (
        <p role="alert" className="text-sm text-err">
          Die Artikel konnten nicht geladen werden. Bitte lade die Seite neu.
        </p>
      )}

      {articles.isSuccess && articles.data.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-raised px-6 py-14 text-center">
          <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
            <SearchX className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">Hier gibt es noch keine Artikel</h2>
          <p className="max-w-sm text-sm text-fg-muted">
            In dieser Kategorie wurde noch nichts veröffentlicht.
          </p>
          <Link to="/" className={buttonStyles('secondary', 'md') + ' mt-3'}>
            Zur Startseite
          </Link>
        </div>
      )}
    </div>
  )
}
