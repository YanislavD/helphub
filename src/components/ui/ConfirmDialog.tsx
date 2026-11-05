import { useEffect, useRef } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Destructive-action confirmation built on the native <dialog> element.
 * showModal() gives us for free: focus trap, Esc to close, inert background, ::backdrop.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(440px,calc(100vw-2rem))] rounded-xl border border-line-2 bg-raised p-0 text-fg shadow-[0_40px_100px_-20px_rgb(0_0_0/0.7)] backdrop:bg-scrim backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-1 p-6">
        <h2 id="confirm-title" className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      <div className="flex justify-end gap-2 rounded-b-xl border-t bg-surface px-6 py-4">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Abbrechen
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Wird gelöscht…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
