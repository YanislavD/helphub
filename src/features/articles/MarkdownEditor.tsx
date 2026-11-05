import {
  Bold,
  Code,
  Heading2,
  Image,
  Info,
  Italic,
  Link as LinkIcon,
  ListOrdered,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useDeferredValue, useLayoutEffect, useRef } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import { cn } from '@/lib/cn'
import { readingMinutes } from '@/lib/format'

interface MarkdownEditorProps {
  title: string
  value: string
  onChange: (value: string) => void
  error?: string
}

interface ToolbarAction {
  label: string
  icon: LucideIcon
  /** Text inserted before / after the selection and the placeholder used when nothing is selected. */
  before: string
  after: string
  placeholder: string
}

const actions: ToolbarAction[] = [
  { label: 'Fett', icon: Bold, before: '**', after: '**', placeholder: 'fetter Text' },
  { label: 'Kursiv', icon: Italic, before: '_', after: '_', placeholder: 'kursiver Text' },
  {
    label: 'Überschrift',
    icon: Heading2,
    before: '\n## ',
    after: '\n',
    placeholder: 'Überschrift',
  },
  {
    label: 'Nummerierte Liste',
    icon: ListOrdered,
    before: '\n1. ',
    after: '\n2. \n3. \n',
    placeholder: 'Schritt',
  },
  {
    label: 'Code',
    icon: Code,
    before: '\n```\n',
    after: '\n```\n',
    placeholder: 'befehl --parameter',
  },
  { label: 'Link', icon: LinkIcon, before: '[', after: '](https://)', placeholder: 'Linktext' },
  {
    label: 'Bild',
    icon: Image,
    before: '![',
    after: '](https://)',
    placeholder: 'Bildbeschreibung',
  },
  {
    label: 'Hinweisbox',
    icon: Info,
    before: '\n> [!NOTE]\n> ',
    after: '\n',
    placeholder: 'Hinweis',
  },
  {
    label: 'Warnbox',
    icon: TriangleAlert,
    before: '\n> [!WARNING]\n> ',
    after: '\n',
    placeholder: 'Achtung',
  },
]

/** Markdown source on the left, live rendered preview on the right (design screen 7). */
export function MarkdownEditor({ title, value, onChange, error }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // After inserting text we want the cursor/selection at a specific place. The textarea is
  // "controlled" (React owns its value), so we remember the wish and apply it after React re-rendered.
  const pendingSelection = useRef<[number, number] | null>(null)

  // The preview may lag a frame behind typing instead of blocking the keyboard.
  const deferredValue = useDeferredValue(value)

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (el && pendingSelection.current) {
      el.focus()
      el.setSelectionRange(...pendingSelection.current)
      pendingSelection.current = null
    }
  }, [value])

  function apply({ before, after, placeholder }: ToolbarAction) {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    const selected = value.slice(selectionStart, selectionEnd) || placeholder
    const next =
      value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
    const start = selectionStart + before.length
    pendingSelection.current = [start, start + selected.length]
    onChange(next)
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Source */}
      <section
        className={cn(
          'flex min-w-0 flex-col overflow-hidden rounded-lg border bg-raised',
          error && 'border-err',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b bg-surface px-3 py-2">
          <div
            className="flex flex-wrap items-center gap-0.5"
            role="toolbar"
            aria-label="Formatierung"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                title={action.label}
                aria-label={action.label}
                onClick={() => apply(action)}
                className="grid size-8 place-items-center rounded-sm text-fg-muted transition hover:bg-hover-2 hover:text-fg"
              >
                <action.icon className="size-4" />
              </button>
            ))}
          </div>
          <span className="hidden text-xs text-fg-subtle sm:block">Markdown</span>
        </div>
        <label htmlFor="article-content" className="sr-only">
          Artikelinhalt (Markdown)
        </label>
        <textarea
          id="article-content"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck
          placeholder={'## Überschrift\n\nBeschreibe die Lösung Schritt für Schritt…'}
          className="min-h-[540px] w-full flex-1 resize-y bg-transparent p-4 font-mono text-[13px] leading-6 text-fg-muted outline-none"
        />
        <div className="flex items-center justify-between border-t bg-surface px-4 py-2 text-xs text-fg-subtle">
          <span>{words} Wörter</span>
          {error && <span className="text-err">{error}</span>}
        </div>
      </section>

      {/* Preview */}
      <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-raised">
        <div className="flex h-[49px] items-center justify-between border-b bg-surface px-4">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
            Live-Vorschau
          </span>
          <span className="text-xs text-fg-subtle">{readingMinutes(value)} Min. Lesezeit</span>
        </div>
        <div className="min-h-[540px] flex-1 p-6 sm:px-7">
          <MarkdownContent>
            {`# ${title.trim() || 'Titel des Artikels'}\n\n${deferredValue || '_Hier erscheint die Vorschau…_'}`}
          </MarkdownContent>
        </div>
      </section>
    </div>
  )
}
