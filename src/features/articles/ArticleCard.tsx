import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import type { RelevanceTier } from '@/features/search/relevance'
import { RelevanceMeter } from '@/features/search/RelevanceMeter'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'

/** The few fields a card needs – both normal list items and search hits have them. */
interface CardArticle {
  id: string
  title: string
  slug: string
  summary: string
  updated_at: string
  category: { name: string } | null
}

interface ArticleCardProps {
  article: CardArticle
  /** When set, a relevance meter is shown (search results). */
  tier?: RelevanceTier
  /** Highlights the top search result. */
  best?: boolean
  onOpen?: () => void
}

/** Result-style card, used for browsing articles and for search results. */
export function ArticleCard({ article, tier, best, onOpen }: ArticleCardProps) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      onClick={onOpen}
      className={cn(
        'block rounded-lg border bg-raised p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:bg-overlay hover:shadow-card',
        best && 'border-accent-line shadow-[0_20px_50px_-30px_var(--accent)]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {best && (
            <Badge variant="accent">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              Beste Übereinstimmung
            </Badge>
          )}
          {article.category && <Badge>{article.category.name}</Badge>}
        </div>
        {tier !== undefined ? (
          <RelevanceMeter tier={tier} />
        ) : (
          <span className="text-xs text-fg-subtle">
            Aktualisiert am {formatDate(article.updated_at)}
          </span>
        )}
      </div>
      <h3 className="mt-3.5 text-lg font-semibold tracking-tight">{article.title}</h3>
      {article.summary && (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-fg-muted">{article.summary}</p>
      )}
    </Link>
  )
}
