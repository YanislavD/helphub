import { cn } from '@/lib/cn'

/** How relevant a hit is compared to the best hit of the same search (0–1). */
function relevanceLabel(relevance: number): string {
  if (relevance >= 0.75) return 'Sehr relevant'
  if (relevance >= 0.4) return 'Relevant'
  return 'Möglicherweise relevant'
}

/** Five small bars, like in the design – plus the label as text for screen readers and sighted users. */
export function RelevanceMeter({ relevance }: { relevance: number }) {
  const filled = Math.max(1, Math.ceil(relevance * 5))
  const label = relevanceLabel(relevance)

  return (
    <span className="inline-flex items-center gap-2" title={label}>
      <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i
            key={i}
            className={cn('h-1 w-3.5 rounded-sm', i < filled ? 'bg-accent-hi' : 'bg-line-2')}
          />
        ))}
      </span>
      <span className="text-xs text-fg-muted">{label}</span>
    </span>
  )
}
