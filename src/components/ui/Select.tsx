import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible label. Pass `hideLabel` for compact toolbar selects. */
  label: string
  hideLabel?: boolean
  error?: string
}

/** Native <select> (best accessibility + mobile pickers) with our styling and a custom chevron. */
export function Select({ label, hideLabel, error, className, children, ...props }: SelectProps) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn('text-[13px] font-medium text-fg-muted', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-md border bg-field pr-9 pl-3 text-sm transition outline-none',
            'hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]',
            error ? 'border-err' : 'border-line-2',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
      </div>
      {error && <span className="text-xs text-err">{error}</span>}
    </div>
  )
}
