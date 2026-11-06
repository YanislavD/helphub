import { Paperclip, Sparkles, Ticket, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useToast } from '@/components/toast/useToast'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'
import { useCreateTicket } from './hooks'
import type { TicketDialogOptions } from './ticket-dialog-context'
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  priorityHints,
  priorityLabels,
  type TicketPriority,
} from './types'

interface TicketDialogProps {
  /** null = closed */
  options: TicketDialogOptions | null
  onClose: () => void
}

/** The "create ticket" modal (design screen 5), built on the native <dialog> element. */
export function TicketDialog({ options, onClose }: TicketDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = options !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dark backdrop reports the <dialog> itself as the target → close.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="ticket-dialog-title"
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(600px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line-2 bg-raised p-0 text-fg shadow-[0_40px_100px_-20px_rgb(0_0_0/0.7)] backdrop:bg-scrim backdrop:backdrop-blur-sm"
    >
      {options && <TicketForm options={options} onClose={onClose} />}
    </dialog>
  )
}

const priorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent']

function TicketForm({ options, onClose }: { options: TicketDialogOptions; onClose: () => void }) {
  const toast = useToast()
  const { user } = useAuth()
  const create = useCreateTicket(user?.id)
  const fileInput = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(options.title ?? '')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ title?: string; description?: string; file?: string }>({})
  const [submitError, setSubmitError] = useState('')

  function pickFile(candidate: File | undefined) {
    if (!candidate) return
    if (!ALLOWED_ATTACHMENT_TYPES.includes(candidate.type)) {
      setErrors((e) => ({
        ...e,
        file: 'Erlaubt sind Bilder (PNG, JPG, WebP), PDF und Textdateien.',
      }))
      return
    }
    if (candidate.size > MAX_ATTACHMENT_BYTES) {
      setErrors((e) => ({ ...e, file: 'Die Datei ist größer als 10 MB.' }))
      return
    }
    setErrors((e) => ({ ...e, file: undefined }))
    setFile(candidate)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    pickFile(event.dataTransfer.files[0])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = { file: errors.file }
    if (title.trim().length < 5) next.title = 'Bitte gib einen Titel mit mindestens 5 Zeichen ein.'
    if (description.trim().length < 10) {
      next.description = 'Bitte beschreibe das Problem kurz (mindestens 10 Zeichen).'
    }
    setErrors(next)
    setSubmitError('')
    if (next.title || next.description) return

    try {
      await create.mutateAsync({
        input: {
          title,
          description,
          priority,
          sourceQuery: options.sourceQuery ?? null,
          sourceArticleId: options.sourceArticleId ?? null,
        },
        file,
      })
      toast({ title: 'Ticket erstellt', description: 'Das IT-Team meldet sich bei dir.' })
      onClose()
    } catch {
      // The typed text stays in the form – nothing is lost.
      setSubmitError(
        'Das Ticket konnte nicht gesendet werden. Deine Eingaben sind noch da – bitte versuche es erneut.',
      )
    }
  }

  const linked = options.sourceQuery
    ? `deiner Suche „${options.sourceQuery}“`
    : options.sourceArticleId
      ? 'dem Artikel, den du gerade gelesen hast'
      : null

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      className="flex max-h-[calc(100dvh-1.5rem)] flex-col"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent-hi">
            <Ticket className="size-[22px]" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 id="ticket-dialog-title" className="text-2xl font-semibold tracking-tight">
              Ticket erstellen
            </h2>
            <p className="text-[13px] text-fg-muted">
              Beschreibe dein Problem – das IT-Team kümmert sich darum.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Schließen">
          <X className="size-[18px]" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
        {linked && (
          <p className="flex items-center gap-2 rounded-md border border-accent-line bg-accent-soft px-3 py-2.5 text-xs text-fg-muted">
            <Sparkles className="size-4 shrink-0 text-accent-hi" aria-hidden="true" />
            <span>Verknüpft mit {linked}</span>
          </p>
        )}

        {submitError && (
          <p
            role="alert"
            className="rounded-md border border-err/30 bg-err-soft px-3 py-2 text-[13px] text-err"
          >
            {submitError}
          </p>
        )}

        <TextField
          label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={150}
          placeholder="z. B. Drucker im Lager druckt nicht"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ticket-description" className="text-[13px] font-medium text-fg-muted">
            Beschreibung
          </label>
          <textarea
            id="ticket-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
            rows={4}
            aria-invalid={errors.description ? true : undefined}
            placeholder="Was passiert genau? Gibt es eine Fehlermeldung? Seit wann?"
            className={cn(
              'w-full resize-y rounded-md border bg-field px-3 py-2.5 text-sm transition outline-none hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]',
              errors.description ? 'border-err' : 'border-line-2',
            )}
          />
          <span className={cn('text-xs', errors.description ? 'text-err' : 'text-fg-subtle')}>
            {errors.description ?? 'Je mehr Details, desto schneller können wir helfen.'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="priority-label" className="text-[13px] font-medium text-fg-muted">
            Priorität
          </span>
          <div
            role="radiogroup"
            aria-labelledby="priority-label"
            className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
          >
            {priorities.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={priority === value}
                onClick={() => setPriority(value)}
                className={cn(
                  'h-[30px] flex-1 rounded-[7px] text-[13px] transition',
                  priority === value
                    ? 'border bg-overlay text-fg shadow-sm'
                    : 'border border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {priorityLabels[value]}
              </button>
            ))}
          </div>
          <span className="text-xs text-fg-subtle">{priorityHints[priority]}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-fg-muted">
            Anhang <span className="font-normal text-fg-subtle">(optional)</span>
          </span>
          <input
            ref={fileInput}
            type="file"
            accept={ALLOWED_ATTACHMENT_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              pickFile(e.target.files?.[0])
              e.target.value = '' // allows picking the same file again after removing it
            }}
          />
          {file ? (
            <div className="flex items-center gap-2.5 rounded-md border border-line-2 bg-hover px-3 py-2.5">
              <Paperclip className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px]">{file.name}</span>
              <span className="text-xs text-fg-subtle">
                {Math.max(1, Math.round(file.size / 1024))} KB
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6"
                aria-label="Anhang entfernen"
                onClick={() => setFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex items-center gap-3 rounded-md border border-dashed border-line-2 bg-hover px-4 py-3.5 text-left text-fg-muted transition hover:border-accent-line hover:bg-accent-soft hover:text-fg"
            >
              <Paperclip className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="text-[13px]">
                Screenshot oder Datei hierher ziehen <span className="text-fg-subtle">oder</span>{' '}
                <span className="text-accent-hi">durchsuchen</span>
              </span>
            </button>
          )}
          <span className={cn('text-xs', errors.file ? 'text-err' : 'text-fg-subtle')}>
            {errors.file ?? 'PNG, JPG, WebP, PDF oder Text – maximal 10 MB.'}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t bg-surface px-6 py-4">
        <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Wird gesendet…' : 'Ticket absenden'}
        </Button>
      </div>
    </form>
  )
}
