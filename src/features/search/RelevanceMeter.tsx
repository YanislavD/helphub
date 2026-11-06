import { cn } from '@/lib/cn'
import { tierBars, tierLabels, type RelevanceTier } from './relevance'

/** Five small bars, like in the design – plus the label as text for screen readers and sighted users. */
export function RelevanceMeter({ tier }: { tier: RelevanceTier }) {
  const filled = tierBars[tier]
  const label = tierLabels[tier]

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
