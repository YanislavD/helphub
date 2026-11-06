import { SearchX } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/button-styles'
import { ArticleCard } from '@/features/articles/ArticleCard'
import { useCategories } from '@/features/articles/hooks'
import { usePublishedArticles } from '@/features/articles/portal-hooks'

/**
 * Stage 4: simple browsing of published articles (all, or one category).
 * Stage 5/6 add the text query (?q=…) with full-text and AI search on top of this page.
 */
export function SearchPage() {
  const [params] = useSearchParams()
  const categorySlug = params.get('category') ?? undefined
  const query = params.get('q')

  const categories = useCategories()
  const articles = usePublishedArticles({ order: 'new', categorySlug, limit: 50 })
  const category = categories.data?.find((c) => c.slug === categorySlug)

  const heading = category ? category.name : 'Alle Artikel'

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.028em]">{heading}</h1>
        <p className="text-sm text-fg-muted">
          {articles.data ? `${articles.data.length} Artikel` : 'Wird geladen…'}
        </p>
      </div>

      {query && (
        <p className="mb-6 rounded-md border border-accent-line bg-accent-soft px-4 py-3 text-sm text-fg-muted">
          Die Suche nach „{query}“ kommt in Etappe 5 und 6. Bis dahin kannst du hier alle Artikel
          durchstöbern.
        </p>
      )}

      <div className="flex flex-col gap-4">
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
            <h2 className="text-lg font-semibold tracking-tight">
              Hier gibt es noch keine Artikel
            </h2>
            <p className="max-w-sm text-sm text-fg-muted">
              In dieser Kategorie wurde noch nichts veröffentlicht.
            </p>
            <Link to="/" className={buttonStyles('secondary', 'md') + ' mt-3'}>
              Zur Startseite
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
