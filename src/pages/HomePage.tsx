import { Search, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getCategoryIcon } from '@/features/articles/category-icons'
import { useCategories } from '@/features/articles/hooks'
import { exampleQueries } from '@/lib/categories'

export function HomePage() {
  const [query, setQuery] = useState('')
  const categoriesQuery = useCategories()
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <section className="bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_srgb,var(--accent)_24%,transparent),transparent_72%)] px-4 pt-16 pb-14 sm:pt-24 sm:pb-[72px]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 text-xs font-medium text-accent-hi">
            <Sparkles className="size-3.5" aria-hidden="true" />
            KI-gestützte Suche
          </span>
          <h1 className="text-[36px] leading-10 font-semibold tracking-[-0.04em] sm:text-[56px] sm:leading-[60px]">
            Wie können wir dir helfen?
          </h1>
          <p className="max-w-xl text-[17px] leading-7 text-fg-muted">
            Beschreibe dein Problem in eigenen Worten – die KI findet die passende Anleitung.
          </p>

          <form onSubmit={handleSubmit} className="mt-2 w-full">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line-2 bg-raised p-2 pl-5 shadow-card transition focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft),0_20px_60px_-20px_var(--accent)]">
              <Search className="size-[22px] shrink-0 text-fg-subtle" aria-hidden="true" />
              <label htmlFor="home-query" className="sr-only">
                Problem beschreiben
              </label>
              <input
                id="home-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Beschreibe dein Problem…"
                autoComplete="off"
                className="h-12 min-w-0 flex-1 bg-transparent text-base tracking-tight outline-none sm:text-lg"
              />
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Lösung finden
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[13px] text-fg-subtle">Zum Beispiel:</span>
              {exampleQueries.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="inline-flex h-[34px] items-center rounded-full border border-line-2 bg-hover px-3.5 text-[13px] text-fg-muted transition hover:border-accent-line hover:bg-accent-soft hover:text-fg"
                >
                  {example}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-4 pb-20 sm:px-6">
        <h2 className="mb-5 text-lg font-semibold tracking-tight">Nach Kategorie stöbern</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesQuery.isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-lg border bg-hover" />
            ))}
          {categoriesQuery.data?.map(({ slug, name, icon }) => {
            const Icon = getCategoryIcon(icon)
            return (
              <Link
                key={slug}
                to={`/search?category=${slug}`}
                className="flex items-center gap-4 rounded-lg border bg-raised p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:bg-overlay hover:shadow-card"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent-hi">
                  <Icon className="size-[22px]" aria-hidden="true" />
                </span>
                <span className="text-[15px] font-semibold">{name}</span>
              </Link>
            )
          })}
        </div>
        {categoriesQuery.isError && (
          <p role="alert" className="text-sm text-err">
            Die Kategorien konnten nicht geladen werden. Bitte lade die Seite neu.
          </p>
        )}
      </section>
    </>
  )
}
