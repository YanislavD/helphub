import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ToastContext, type ToastInput, type ToastVariant } from './toast-context'

interface ToastItem extends ToastInput {
  id: number
  variant: ToastVariant
}

const icons = {
  success: <CircleCheck className="size-[18px] text-ok" aria-hidden="true" />,
  error: <CircleAlert className="size-[18px] text-err" aria-hidden="true" />,
  info: <Info className="size-[18px] text-accent-hi" aria-hidden="true" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      setToasts((current) => [...current, { ...input, id, variant: input.variant ?? 'success' }])
      // Errors stay a bit longer so people can read them.
      window.setTimeout(() => dismiss(id), input.variant === 'error' ? 7000 : 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext value={value}>
      {children}
      {/* aria-live: screen readers announce new toasts without moving focus */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border border-line-2 bg-overlay px-3.5 py-3 shadow-card',
            )}
          >
            <span className="mt-0.5">{icons[t.variant]}</span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold">{t.title}</span>
              {t.description && <span className="text-[13px] text-fg-muted">{t.description}</span>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Schließen"
              className="grid size-6 place-items-center rounded-sm text-fg-subtle transition hover:bg-hover-2 hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
