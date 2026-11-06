import { FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/toast/useToast'
import { rebuildSearchIndex } from '@/features/articles/indexing'
import { useAuth } from '@/features/auth/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { PAGE_SIZE, type ArticleFilters } from '@/features/articles/api'
import { useArticles, useCategories, useDeleteArticle } from '@/features/articles/hooks'
import type { ArticleListItem, ArticleStatus } from '@/features/articles/types'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

const statusTabs: Array<{ value: ArticleStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'published', label: 'Veröffentlicht' },
  { value: 'draft', label: 'Entwurf' },
]

export function ArticlesPage() {
  const toast = useToast()
  const { role } = useAuth()
  const [rebuilding, setRebuilding] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  async function handleRebuildIndex() {
    setRebuilding(true)
    try {
      const result = await rebuildSearchIndex((done, total) => setProgress({ done, total }))
      toast({
        title: 'Suchindex aktualisiert',
        description: `${result.indexed} Artikel, ${result.chunks} Abschnitte.`,
      })
    } catch {
      toast({
        title: 'Index konnte nicht erstellt werden',
        description: 'Bitte versuche es erneut. Details stehen im Funktions-Log von Supabase.',
        variant: 'error',
      })
    } finally {
      setRebuilding(false)
    }
  }

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [status, setStatus] = useState<ArticleStatus | 'all'>('all')
  const [page, setPage] = useState(0)
  const [toDelete, setToDelete] = useState<ArticleListItem | null>(null)

  // Wait until the user stops typing before asking the database.
  const debouncedSearch = useDebouncedValue(search)
  const filters: ArticleFilters = { search: debouncedSearch, categoryId, status, page }

  const categories = useCategories()
  const articles = useArticles(filters)
  const deleteMutation = useDeleteArticle()

  const total = articles.data?.total ?? 0
  const items = articles.data?.items ?? []
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const hasFilters = Boolean(search || categoryId !== 'all' || status !== 'all')

  // Changing a filter always jumps back to the first page.
  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(0)
    }
  }

  function resetFilters() {
    setSearch('')
    setCategoryId('all')
    setStatus('all')
    setPage(0)
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      toast({ title: 'Artikel gelöscht', description: `„${toDelete.title}“ wurde entfernt.` })
      setToDelete(null)
    } catch {
      toast({
        title: 'Löschen fehlgeschlagen',
        description: 'Bitte versuche es erneut.',
        variant: 'error',
      })
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Artikel</h1>
          <p className="text-[13px] text-fg-muted">
            {articles.data ? `${total} Artikel` : 'Wird geladen…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === 'admin' && (
            <Button
              variant="secondary"
              onClick={() => void handleRebuildIndex()}
              disabled={rebuilding}
              title="Berechnet die KI-Suche für alle veröffentlichten Artikel neu"
            >
              <RefreshCw
                className={cn('size-4', rebuilding && 'animate-spin')}
                aria-hidden="true"
              />
              {rebuilding
                ? `Index wird erstellt… (${progress.done}/${progress.total})`
                : 'Suchindex neu aufbauen'}
            </Button>
          )}
          <Link to="/agent/articles/new" className={buttonStyles('primary', 'md')}>
            <Plus className="size-4" aria-hidden="true" />
            Neuer Artikel
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1.5 sm:w-80">
            <label htmlFor="article-search" className="sr-only">
              Artikel durchsuchen
            </label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-line-2 bg-field px-3 transition focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
              <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <input
                id="article-search"
                value={search}
                onChange={(e) => changeFilter(setSearch)(e.target.value)}
                placeholder="Titel durchsuchen…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Kategorie"
              hideLabel
              value={categoryId}
              onChange={(e) => changeFilter(setCategoryId)(e.target.value)}
            >
              <option value="all">Kategorie: Alle</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div
            role="group"
            aria-label="Status filtern"
            className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
          >
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={status === tab.value}
                onClick={() => changeFilter(setStatus)(tab.value)}
                className={cn(
                  'h-[30px] rounded-[7px] px-3 text-[13px] transition',
                  status === tab.value
                    ? 'border bg-overlay text-fg shadow-sm'
                    : 'border border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Error */}
        {articles.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-err/30 bg-err-soft p-4 text-sm text-err"
          >
            <span>Die Artikel konnten nicht geladen werden.</span>
            <Button variant="secondary" size="sm" onClick={() => void articles.refetch()}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Table */}
        {!articles.isError && (
          <div className="overflow-x-auto rounded-lg border bg-raised">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-surface text-left text-xs font-medium text-fg-subtle">
                  <th className="px-4 py-3">Titel</th>
                  <th className="px-4 py-3">Kategorie</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aufrufe</th>
                  <th className="px-4 py-3">Aktualisiert</th>
                  <th className="w-24 px-4 py-3">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {articles.isPending &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={6} className="px-4 py-3.5">
                        <div className="h-5 animate-pulse rounded-sm bg-hover-2" />
                      </td>
                    </tr>
                  ))}

                {items.map((article) => (
                  <tr key={article.id} className="border-b transition last:border-0 hover:bg-hover">
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/agent/articles/${article.id}`}
                        className="font-semibold hover:text-accent-hi"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      {article.category && <Badge>{article.category.name}</Badge>}
                    </td>
                    <td className="px-4 py-3.5">
                      {article.status === 'published' ? (
                        <Badge variant="ok" dot>
                          Veröffentlicht
                        </Badge>
                      ) : (
                        <Badge variant="warn" dot>
                          Entwurf
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-fg-muted tabular-nums">
                      {article.status === 'published'
                        ? article.view_count.toLocaleString('de-DE')
                        : '–'}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-fg-muted">
                      {formatDate(article.updated_at)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-0.5">
                        <Link
                          to={`/agent/articles/${article.id}`}
                          aria-label={`„${article.title}“ bearbeiten`}
                          className={buttonStyles('ghost', 'icon-sm')}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`„${article.title}“ löschen`}
                          onClick={() => setToDelete(article)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {articles.isSuccess && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
                  <FileText className="size-6" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight">
                  {hasFilters ? 'Keine Artikel gefunden' : 'Noch keine Artikel'}
                </h2>
                <p className="max-w-sm text-sm text-fg-muted">
                  {hasFilters
                    ? 'Mit diesen Filtern gibt es keine Treffer. Ändere die Filter oder schreibe einen neuen Artikel.'
                    : 'Schreibe den ersten Artikel für die Wissensdatenbank.'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {hasFilters && (
                    <Button variant="secondary" onClick={resetFilters}>
                      Filter zurücksetzen
                    </Button>
                  )}
                  <Link to="/agent/articles/new" className={buttonStyles('primary', 'md')}>
                    <Plus className="size-4" aria-hidden="true" />
                    Neuer Artikel
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-fg-muted">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} von {total} Artikeln
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Zurück
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
              >
                Weiter
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Artikel löschen?"
        description={`„${toDelete?.title ?? ''}“ wird dauerhaft entfernt. Das lässt sich nicht rückgängig machen.`}
        confirmLabel="Endgültig löschen"
        pending={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
