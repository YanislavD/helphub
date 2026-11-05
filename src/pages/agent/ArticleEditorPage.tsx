import { ArrowLeft, Check } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/components/toast/useToast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/ui/TagInput'
import { TextField } from '@/components/ui/TextField'
import { useArticle, useCategories, useSaveArticle } from '@/features/articles/hooks'
import { MarkdownEditor } from '@/features/articles/MarkdownEditor'
import type { Article, ArticleInput, ArticleStatus } from '@/features/articles/types'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

/** Loads the article (when editing) and renders the form once the data is there. */
export function ArticleEditorPage() {
  const { id } = useParams()
  const article = useArticle(id)

  if (id && article.isPending) {
    return (
      <div className="p-6" aria-busy="true" aria-label="Artikel wird geladen">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="h-12 animate-pulse rounded-md bg-hover-2" />
          <div className="h-[540px] animate-pulse rounded-lg bg-hover" />
        </div>
      </div>
    )
  }

  if (id && article.isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Artikel nicht gefunden</h1>
        <p className="text-sm text-fg-muted">
          Der Artikel existiert nicht (mehr) oder du hast keinen Zugriff darauf.
        </p>
        <Link to="/agent/articles" className={buttonStyles('secondary', 'md')}>
          Zur Artikelliste
        </Link>
      </div>
    )
  }

  // `key` makes React build a fresh form whenever we switch to another article.
  return <ArticleForm key={article.data?.id ?? 'new'} initial={article.data} />
}

interface FormValues {
  title: string
  categoryId: string
  tags: string[]
  summary: string
  content: string
  status: ArticleStatus
}

function toFormValues(article?: Article): FormValues {
  return {
    title: article?.title ?? '',
    categoryId: article?.category_id ?? '',
    tags: article?.tags ?? [],
    summary: article?.summary ?? '',
    content: article?.content ?? '',
    status: article?.status ?? 'draft',
  }
}

function ArticleForm({ initial }: { initial?: Article }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const categories = useCategories()
  const save = useSaveArticle(user?.id)

  const [values, setValues] = useState<FormValues>(() => toFormValues(initial))
  const [errors, setErrors] = useState<{ title?: string; category?: string; content?: string }>({})
  // The last saved state – used to detect unsaved changes.
  const [baseline, setBaseline] = useState(() => JSON.stringify(toFormValues(initial)))
  const dirty = JSON.stringify(values) !== baseline

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  // Ask the browser to warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}
    if (values.title.trim().length < 3) next.title = 'Der Titel braucht mindestens 3 Zeichen.'
    if (!values.categoryId) next.category = 'Bitte wähle eine Kategorie.'
    if (values.status === 'published' && values.content.trim().length < 20) {
      next.content = 'Ein veröffentlichter Artikel braucht Inhalt.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    const input: ArticleInput = {
      title: values.title.trim(),
      summary: values.summary.trim(),
      content: values.content,
      category_id: values.categoryId,
      tags: values.tags,
      status: values.status,
    }

    try {
      const saved = await save.mutateAsync({ id: initial?.id, input })
      setBaseline(JSON.stringify(values))
      toast({
        title: values.status === 'published' ? 'Artikel veröffentlicht' : 'Entwurf gespeichert',
        description: `„${saved.title}“`,
      })
      if (!initial) navigate(`/agent/articles/${saved.id}`, { replace: true })
    } catch {
      toast({
        title: 'Speichern fehlgeschlagen',
        description: 'Deine Eingaben sind noch da. Bitte versuche es erneut.',
        variant: 'error',
      })
    }
  }

  const published = values.status === 'published'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/agent/articles"
            aria-label="Zurück zur Artikelliste"
            className={buttonStyles('ghost', 'icon-sm')}
          >
            <ArrowLeft className="size-[18px]" />
          </Link>
          <h1 className="text-[15px] font-semibold">
            {initial ? 'Artikel bearbeiten' : 'Neuer Artikel'}
          </h1>
          {published ? (
            <Badge variant="ok" dot>
              Veröffentlicht
            </Badge>
          ) : (
            <Badge variant="warn" dot>
              Entwurf
            </Badge>
          )}
          {dirty && <span className="text-xs text-fg-subtle">Ungespeicherte Änderungen</span>}
        </div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            'Wird gespeichert…'
          ) : (
            <>
              <Check className="size-4" aria-hidden="true" />
              {published ? 'Veröffentlichen' : 'Als Entwurf speichern'}
            </>
          )}
        </Button>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:px-6">
        <TextField
          label="Titel"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          maxLength={200}
          placeholder="z. B. VPN verbindet nicht – Fehlercode 809 beheben"
          className="h-[52px] px-4 text-xl font-semibold tracking-tight"
        />

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
          <Select
            label="Kategorie"
            value={values.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            error={errors.category}
          >
            <option value="" disabled>
              Kategorie wählen…
            </option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <TagInput label="Tags" tags={values.tags} onChange={(tags) => set('tags', tags)} />
          <div className="flex flex-col gap-1.5">
            <span id="status-label" className="text-[13px] font-medium text-fg-muted">
              Status
            </span>
            <div className="flex h-10 items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={published}
                aria-labelledby="status-label"
                onClick={() => set('status', published ? 'draft' : 'published')}
                className={cn(
                  'relative h-6 w-10 shrink-0 rounded-full border transition',
                  published ? 'border-accent bg-accent' : 'border-line-2 bg-hover-2',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 size-[18px] rounded-full transition',
                    published ? 'translate-x-4 bg-white' : 'bg-fg-muted',
                  )}
                />
              </button>
              <span className={cn('text-sm', published ? 'text-fg' : 'text-fg-muted')}>
                {published ? 'Veröffentlicht' : 'Entwurf'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="article-summary" className="text-[13px] font-medium text-fg-muted">
            Kurzbeschreibung
          </label>
          <textarea
            id="article-summary"
            value={values.summary}
            onChange={(e) => set('summary', e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Ein bis zwei Sätze, die in den Suchergebnissen erscheinen."
            className="w-full resize-y rounded-md border border-line-2 bg-field px-3 py-2.5 text-sm transition outline-none hover:border-fg/30 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
          <span className="text-xs text-fg-subtle">{values.summary.length}/300 Zeichen</span>
        </div>
      </div>

      {/* Editor + preview */}
      <div className="px-4 pb-8 sm:px-6">
        <MarkdownEditor
          title={values.title}
          value={values.content}
          onChange={(content) => set('content', content)}
          error={errors.content}
        />
      </div>
    </form>
  )
}
