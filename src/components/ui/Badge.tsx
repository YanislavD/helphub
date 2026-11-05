import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'neutral' | 'accent' | 'ok' | 'warn' | 'err'

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-line bg-hover-2 text-fg-muted',
  accent: 'border-accent-line bg-accent-soft text-accent-hi',
  ok: 'border-ok/30 bg-ok-soft text-ok',
  warn: 'border-warn/30 bg-warn-soft text-warn',
  err: 'border-err/30 bg-err-soft text-err',
}

interface BadgeProps {
  variant?: BadgeVariant
  /** Show a small status dot before the text. */
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'neutral', dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2.5 text-xs leading-none font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
