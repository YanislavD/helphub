import { ChevronRight, Clock, Eye } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MarkdownContent } from '@/components/MarkdownContent'
import { Badge } from '@/components/ui/Badge'
import { buttonStyles } from '@/components/ui/button-styles'
import { incrementArticleViews } from '@/features/articles/portal-api'
import { FeedbackBlock } from '@/features/feedback/FeedbackBlock'
import { useFeedbackStats } from '@/features/feedback/hooks'
import { useTicketDialog } from '@/features/tickets/useTicketDialog'
import { Button } from '@/components/ui/Button'
import {
  useAuthorName,
  usePublishedArticle,
  useRelatedArticles,
} from '@/features/articles/portal-hooks'
import { extractToc } from '@/features/articles/toc'
import { formatDate, readingMinutes } from '@/lib/format'

function ArticleSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1160px] px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Artikel wird geladen"
    >
      <div className="max-w-[760px] space-y-4">
        <div className="h-6 w-40 animate-pulse rounded-full bg-hover-2" />
        <div className="h-12 w-4/5 animate-pulse rounded-md bg-hover-2" />
        <div className="h-5 w-full animate-pulse rounded-sm bg-hover" />
        <div className="h-5 w-3/4 animate-pulse rounded-sm bg-hover" />
        <div className="h-64 animate-pulse rounded-lg bg-hover" />
      </div>
    </div>
  )
}

function ArticleNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 font-mono text-lg font-semibold text-fg-muted">
        404
      </span>
      <h1 className="text-xl font-semibold tracking-tight">Diesen Artikel gibt es nicht (mehr)</h1>
      <p className="text-sm text-fg-muted">
        Der Link ist veraltet oder der Artikel wurde noch nicht veröffentlicht. Suche nach dem Thema
        – wir finden eine Alternative.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonStyles('primary', 'md')}>
          Zur Startseite
        </Link>
        <Link to="/search" className={buttonStyles('secondary', 'md')}>
          Artikel durchsuchen
        </Link>
      </div>
    </div>
  )
}

export function ArticlePage() {
  const { slug } = useParams()
  const articleQuery = usePublishedArticle(slug)
  const article = articleQuery.data
  const articleId = article?.id

  const author = useAuthorName(article?.author_id)
  const related = useRelatedArticles(article?.category_id, articleId)
  const stats = useFeedbackStats(articleId)
  const { openTicketDialog } = useTicketDialog()

  // Count the view once per browser session and article. sessionStorage also protects against
  // React StrictMode (which runs effects twice in development) and against reload spam.
  useEffect(() => {
    if (!articleId) return
    const key = `helphub:viewed:${articleId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* storage unavailable – count anyway */
    }
    void incrementArticleViews(articleId).catch(() => {
      /* a failed counter must never break reading */
    })
  }, [articleId])

  if (articleQuery.isPending) return <ArticleSkeleton />

  if (articleQuery.isError) {
    return (
      <div role="alert" className="mx-auto max-w-md px-6 py-24 text-center text-sm text-err">
        Der Artikel konnte nicht geladen werden. Bitte lade die Seite neu.
      </div>
    )
  }

  if (!article) return <ArticleNotFound />

  const toc = extractToc(article.content)
  const ticketPrefill = {
    title: `Problem mit: ${article.title}`.slice(0, 150),
    sourceArticleId: article.id,
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 pt-7 pb-24 sm:px-6">
      <nav
        aria-label="Brotkrumen"
        className="mb-7 flex flex-wrap items-center gap-2 text-[13px] text-fg-subtle"
      >
        <Link to="/" className="hover:text-fg">
          Startseite
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        {article.category && (
          <>
            <Link to={`/search?category=${article.category.slug}`} className="hover:text-fg">
              {article.category.name}
            </Link>
            <ChevronRight className="size-4" aria-hidden="true" />
          </>
        )}
        <span className="text-fg-muted" aria-current="page">
          {article.title}
        </span>
      </nav>

      <div className="flex flex-wrap items-start gap-12">
        <article className="max-w-[760px] min-w-0 flex-[999_1_560px]">
          <header className="mb-8 flex flex-col gap-4 border-b pb-7">
            <div className="flex flex-wrap gap-2">
              {article.category && <Badge variant="accent">{article.category.name}</Badge>}
              {article.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.032em] sm:text-[40px] sm:leading-[48px]">
              {article.title}
            </h1>
            {article.summary && (
              <p className="text-[17px] leading-7 text-fg-muted">{article.summary}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-fg-subtle">
              {author.data && <span className="text-fg-muted">{author.data} · IT-Support</span>}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {readingMinutes(article.content)} Min. Lesezeit
              </span>
              <span>Aktualisiert am {formatDate(article.updated_at)}</span>
            </div>
          </header>

          <MarkdownContent>{article.content}</MarkdownContent>

          <div className="mt-10 flex flex-col gap-4">
            <FeedbackBlock
              articleId={article.id}
              onCreateTicket={() => openTicketDialog(ticketPrefill)}
            />
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent-line bg-[linear-gradient(135deg,var(--accent-soft),transparent_65%)] p-6">
              <div className="flex flex-col">
                <h2 className="text-[15px] font-semibold">Problem nicht gelöst?</h2>
                <p className="text-[13px] text-fg-muted">
                  Erstelle ein Ticket – wir übernehmen den Artikel als Hinweis.
                </p>
              </div>
              <Button onClick={() => openTicketDialog(ticketPrefill)}>Ticket erstellen</Button>
            </section>
          </div>
        </article>

        <aside className="flex max-w-[320px] min-w-0 flex-[1_1_260px] flex-col gap-4">
          {toc.length > 1 && (
            <nav
              aria-label="Auf dieser Seite"
              className="flex flex-col gap-2 rounded-lg border bg-raised p-5"
            >
              <span className="mb-1 text-xs font-medium tracking-wider text-fg-subtle uppercase">
                Auf dieser Seite
              </span>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-[13px] text-fg-muted transition hover:text-accent-hi"
                >
                  {item.text}
                </a>
              ))}
            </nav>
          )}

          {related.data && related.data.length > 0 && (
            <div className="overflow-hidden rounded-lg border bg-raised">
              <div className="px-5 pt-4 pb-2">
                <span className="text-xs font-medium tracking-wider text-fg-subtle uppercase">
                  Ähnliche Artikel
                </span>
              </div>
              <ul className="flex flex-col p-2 pt-0">
                {related.data.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/articles/${item.slug}`}
                      className="block rounded-sm px-3 py-2.5 transition hover:bg-hover-2"
                    >
                      <span className="text-[13px] leading-5 font-semibold">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.data && stats.data.total >= 3 && (
            <div className="flex flex-col gap-2 rounded-lg border bg-raised p-5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Hilfreich</span>
                <span className="font-semibold tabular-nums">
                  {Math.round((stats.data.helpful / stats.data.total) * 100)} %
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-hover-2"
                role="img"
                aria-label={`${stats.data.helpful} von ${stats.data.total} fanden den Artikel hilfreich`}
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(stats.data.helpful / stats.data.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-fg-subtle">{stats.data.total} Bewertungen</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border bg-raised p-5 text-[13px]">
            <span className="inline-flex items-center gap-2 text-fg-muted">
              <Eye className="size-4" aria-hidden="true" />
              Aufrufe
            </span>
            <span className="font-semibold tabular-nums">
              {article.view_count.toLocaleString('de-DE')}
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
