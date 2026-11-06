import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  DraftError,
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  generateArticleDraft,
  type AiDraft,
} from './ai-draft'

interface AiDraftPanelProps {
  /** e.g. the search term the dashboard flagged as unanswered – helps the model pick the topic. */
  titleHint?: string
  /** true if the editor already contains text that a draft would overwrite */
  hasContent: boolean
  onApply: (draft: AiDraft) => void
}

/**
 * "Describe the solution you found – the AI writes a draft."
 * The draft goes into the editor (as a draft, nothing is saved or published) so a human can check it.
 */
export function AiDraftPanel({ titleHint, hasContent, onApply }: AiDraftPanelProps) {
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [waitingDraft, setWaitingDraft] = useState<AiDraft | null>(null)

  const tooShort = description.trim().length < MIN_DESCRIPTION

  async function handleGenerate() {
    setPending(true)
    setError('')
    try {
      const draft = await generateArticleDraft(description, titleHint)
      // Never silently throw away what the agent has already written.
      if (hasContent) setWaitingDraft(draft)
      else onApply(draft)
    } catch (e) {
      setError(e instanceof DraftError ? e.message : 'Der Entwurf konnte nicht erstellt werden.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-accent-line bg-[linear-gradient(135deg,var(--accent-soft),transparent_65%)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent-line bg-accent-soft text-accent-hi">
          <Sparkles className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold">KI-Assistent</h2>
          <p className="text-[13px] text-fg-muted">
            Beschreibe in eigenen Worten, welches Problem du gelöst hast und wie. Die KI schreibt
            daraus eine Anleitung als Entwurf – du prüfst und änderst sie, bevor sie veröffentlicht
            wird.
          </p>
        </div>
      </div>

      <label htmlFor="ai-description" className="sr-only">
        Beschreibung der Lösung
      </label>
      <textarea
        id="ai-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={MAX_DESCRIPTION}
        rows={5}
        disabled={pending}
        placeholder="z. B. Gestern hatte ein Kollege ein Problem mit seiner Dienstnummer. Ich habe ihm gesagt, er soll seine private SIM-Karte entfernen und das Telefon neu starten. Danach war das Problem weg, denn das Diensthandy darf nur eine SIM-Karte haben (Schutzfunktion)."
        className="w-full resize-y rounded-md border border-line-2 bg-field px-3 py-2.5 text-sm transition outline-none hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-60"
      />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-err/30 bg-err-soft px-3 py-2 text-[13px] text-err"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-fg-subtle" aria-live="polite">
          {pending
            ? 'Die KI schreibt deinen Entwurf … das dauert bis zu 20 Sekunden.'
            : `${description.length}/${MAX_DESCRIPTION} Zeichen · Gib keine Passwörter oder personenbezogene Daten ein.`}
        </span>
        <Button type="button" onClick={() => void handleGenerate()} disabled={pending || tooShort}>
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Entwurf wird erstellt…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" />
              Entwurf mit KI erstellen
            </>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={waitingDraft !== null}
        title="Aktuellen Inhalt ersetzen?"
        description="Im Editor steht schon Text. Der KI-Entwurf ersetzt Titel, Beschreibung, Inhalt und Tags."
        confirmLabel="Ersetzen"
        onConfirm={() => {
          if (waitingDraft) onApply(waitingDraft)
          setWaitingDraft(null)
        }}
        onCancel={() => setWaitingDraft(null)}
      />
    </section>
  )
}
