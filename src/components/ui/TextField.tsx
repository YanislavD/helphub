import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  /** Optional element on the right of the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode
}

/** Label + input + hint/error, wired together for screen readers. */
export function TextField({ label, hint, error, labelAside, className, ...props }: TextFieldProps) {
  const id = useId()
  const messageId = `${id}-msg`
  const message = error ?? hint

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-fg-muted">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          'h-10 w-full rounded-md border bg-field px-3 text-sm transition outline-none',
          'hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]',
          error
            ? 'border-err focus:border-err focus:shadow-[0_0_0_3px_var(--err-soft)]'
            : 'border-line-2',
          className,
        )}
        {...props}
      />
      {message && (
        <span id={messageId} className={cn('text-xs', error ? 'text-err' : 'text-fg-subtle')}>
          {message}
        </span>
      )}
    </div>
  )
}
