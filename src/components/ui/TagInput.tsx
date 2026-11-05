import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
}

const MAX_TAGS = 10

/** Free-form tags: Enter or comma adds one, Backspace on an empty field removes the last. */
export function TagInput({ label, tags, onChange }: TagInputProps) {
  const id = useId()
  const [draft, setDraft] = useState('')

  function addDraft() {
    const value = draft.trim().replace(/,+$/, '')
    setDraft('')
    if (!value || tags.length >= MAX_TAGS) return
    // Tags are case-insensitive duplicates of each other ("VPN" vs "vpn").
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return
    onChange([...tags, value])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addDraft()
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-fg-muted">
        {label}
      </label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-line-2 bg-field px-2 py-1.5 transition focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-[24px] items-center gap-1 rounded-full border border-accent-line bg-accent-soft pr-1 pl-2.5 text-xs font-medium text-accent-hi"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`Tag „${tag}“ entfernen`}
              className="grid size-4 place-items-center rounded-full hover:bg-accent/30"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
          placeholder={tags.length ? '' : 'Tag hinzufügen…'}
          disabled={tags.length >= MAX_TAGS}
          className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>
    </div>
  )
}
