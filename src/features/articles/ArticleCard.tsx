import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { PortalArticle } from './portal-api'

/** Result-style card, used for browsing articles (search results will reuse it in stage 5). */
export function ArticleCard({ article }: { article: PortalArticle }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block rounded-lg border bg-raised p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:bg-overlay hover:shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {article.category && <Badge>{article.category.name}</Badge>}
        <span className="text-xs text-fg-subtle">
          Aktualisiert am {formatDate(article.updated_at)}
        </span>
      </div>
      <h3 className="mt-3.5 text-lg font-semibold tracking-tight">{article.title}</h3>
      {article.summary && (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-fg-muted">{article.summary}</p>
      )}
    </Link>
  )
}
