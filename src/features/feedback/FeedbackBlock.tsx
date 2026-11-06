import { Check, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/toast/useToast'
import { Button } from '@/components/ui/Button'
import { useDeleteFeedback, useMyFeedback, useSaveFeedback } from './hooks'

interface FeedbackBlockProps {
  articleId: string
  /** Called when the reader says the article did not help and wants to open a ticket. */
  onCreateTicket: () => void
}

/** "War dieser Artikel hilfreich?" – thumbs up/down, optional comment, ticket shortcut after 👎. */
export function FeedbackBlock({ articleId, onCreateTicket }: FeedbackBlockProps) {
  const toast = useToast()
  const mine = useMyFeedback(articleId)
  const save = useSaveFeedback(articleId)
  const remove = useDeleteFeedback(articleId)

  const busy = save.isPending || remove.isPending

  function fail() {
    toast({
      title: 'Feedback konnte nicht gespeichert werden',
      description: 'Bitte versuche es gleich noch einmal.',
      variant: 'error',
    })
  }

  if (mine.isPending) {
    return <div className="h-[92px] animate-pulse rounded-lg border bg-hover" aria-hidden="true" />
  }

  const feedback = mine.data

  // 1) not voted yet
  if (!feedback) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-raised p-6">
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold">War dieser Artikel hilfreich?</h2>
          <p className="text-[13px] text-fg-muted">
            Dein Feedback hilft uns, die Anleitungen zu verbessern.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => save.mutate({ helpful: true, comment: '' }, { onError: fail })}
          >
            <ThumbsUp className="size-4" aria-hidden="true" />
            Ja, geholfen
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => save.mutate({ helpful: false, comment: '' }, { onError: fail })}
          >
            <ThumbsDown className="size-4" aria-hidden="true" />
            Nein
          </Button>
        </div>
      </section>
    )
  }

  // 2) 👍
  if (feedback.helpful) {
    return (
      <section className="flex items-center gap-4 rounded-lg border bg-raised p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-ok/30 bg-ok-soft text-ok">
          <Check className="size-[22px]" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-[15px] font-semibold">Danke für dein Feedback!</h2>
          <p className="text-[13px] text-fg-muted">Schön, dass wir helfen konnten.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => remove.mutate(undefined, { onError: fail })}
        >
          Rückgängig
        </Button>
      </section>
    )
  }

  // 3) 👎 – ask what was missing, offer a ticket
  return (
    <NegativeFeedback
      key={feedback.comment}
      initialComment={feedback.comment}
      busy={busy}
      onSend={(comment) =>
        save.mutate(
          { helpful: false, comment },
          {
            onSuccess: () => toast({ title: 'Danke – dein Kommentar wurde gespeichert' }),
            onError: fail,
          },
        )
      }
      onUndo={() => remove.mutate(undefined, { onError: fail })}
      onCreateTicket={onCreateTicket}
    />
  )
}

function NegativeFeedback({
  initialComment,
  busy,
  onSend,
  onUndo,
  onCreateTicket,
}: {
  initialComment: string
  busy: boolean
  onSend: (comment: string) => void
  onUndo: () => void
  onCreateTicket: () => void
}) {
  const [comment, setComment] = useState(initialComment)

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-raised p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Schade – was hat gefehlt?</h2>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onUndo}>
          Zurück
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="feedback-comment" className="text-[13px] font-medium text-fg-muted">
          Kommentar (optional)
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="z. B. Der Link zur Seite funktioniert bei mir nicht…"
          className="w-full resize-y rounded-md border border-line-2 bg-field px-3 py-2.5 text-sm transition outline-none hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={busy || comment === initialComment}
          onClick={() => onSend(comment)}
        >
          Feedback senden
        </Button>
        <Button onClick={onCreateTicket}>Ticket erstellen</Button>
      </div>
    </section>
  )
}
