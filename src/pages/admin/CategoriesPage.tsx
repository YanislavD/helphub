import { ChevronDown, ChevronUp, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/toast/useToast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextField } from '@/components/ui/TextField'
import {
  useArticleCounts,
  useCreateCategory,
  useDeleteCategory,
  useSaveCategoryOrder,
  useUpdateCategory,
} from '@/features/admin/hooks'
import { adminErrorMessage, moveItem } from '@/features/admin/utils'
import {
  categoryIconNames,
  getCategoryIcon,
  getCategoryIconLabel,
} from '@/features/articles/category-icons'
import { useCategories } from '@/features/articles/hooks'
import type { Category } from '@/features/articles/types'
import { cn } from '@/lib/cn'
import { slugify } from '@/lib/slugify'

/** Admin: manage the categories of the knowledge base (design screen 9, left part). */
export function CategoriesPage() {
  const toast = useToast()
  const categories = useCategories()
  const counts = useArticleCounts()
  const reorder = useSaveCategoryOrder()
  // null = nothing selected, 'new' = creating, otherwise the id of the category being edited
  const [selected, setSelected] = useState<string | 'new' | null>(null)

  const list = categories.data ?? []
  const current = list.find((c) => c.id === selected)

  async function move(id: string, direction: 'up' | 'down') {
    const ids = list.map((c) => c.id)
    const next = moveItem(ids, id, direction)
    if (next === ids) return
    try {
      await reorder.mutateAsync(next)
    } catch (error) {
      toast({
        title: 'Reihenfolge nicht gespeichert',
        description: adminErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Kategorien</h1>
          <p className="text-[13px] text-fg-muted">
            Die Struktur der Wissensdatenbank. Die Reihenfolge gilt auch auf der Startseite.
          </p>
        </div>
        <Button onClick={() => setSelected('new')}>
          <Plus className="size-4" aria-hidden="true" />
          Neue Kategorie
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-4 px-4 py-6 sm:px-8">
        {/* List */}
        <section className="min-w-0 flex-[3_1_460px] overflow-hidden rounded-lg border bg-raised">
          {categories.isPending && (
            <div className="flex flex-col gap-3 p-4" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-hover-2" />
              ))}
            </div>
          )}

          {categories.isError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-err"
            >
              <span>Die Kategorien konnten nicht geladen werden.</span>
              <Button variant="secondary" size="sm" onClick={() => void categories.refetch()}>
                Erneut versuchen
              </Button>
            </div>
          )}

          {categories.isSuccess && list.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
                <FolderOpen className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold tracking-tight">Noch keine Kategorien</h2>
              <p className="max-w-sm text-sm text-fg-muted">
                Lege die erste Kategorie an, um Artikel zu ordnen.
              </p>
            </div>
          )}

          <ul className="flex flex-col">
            {list.map((category, index) => {
              const Icon = getCategoryIcon(category.icon)
              const count = counts.data?.[category.id] ?? 0
              return (
                <li
                  key={category.id}
                  className={cn(
                    'flex items-center gap-3 border-b px-4 py-3 last:border-0',
                    selected === category.id && 'bg-accent-soft',
                  )}
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label={`„${category.name}“ nach oben`}
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => void move(category.id, 'up')}
                      className="grid size-6 place-items-center rounded-sm text-fg-subtle transition hover:bg-hover-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`„${category.name}“ nach unten`}
                      disabled={index === list.length - 1 || reorder.isPending}
                      onClick={() => void move(category.id, 'down')}
                      className="grid size-6 place-items-center rounded-sm text-fg-subtle transition hover:bg-hover-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-accent-line bg-accent-soft text-accent-hi">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{category.name}</span>
                    <span className="truncate font-mono text-xs text-fg-subtle">
                      {category.slug}
                    </span>
                  </div>
                  <span className="hidden text-[13px] text-fg-muted tabular-nums sm:block">
                    {count} Artikel
                  </span>
                  <Badge>{index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`„${category.name}“ bearbeiten`}
                    onClick={() => setSelected(category.id)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Edit panel */}
        <section className="min-w-0 flex-[2_1_340px] rounded-lg border bg-raised">
          {selected === null ? (
            <p className="p-6 text-sm text-fg-muted">
              Wähle links eine Kategorie zum Bearbeiten oder lege mit „Neue Kategorie“ eine neue an.
            </p>
          ) : (
            <CategoryForm
              key={selected}
              category={current}
              nextOrder={list.length + 1}
              articleCount={current ? (counts.data?.[current.id] ?? 0) : 0}
              onClose={() => setSelected(null)}
            />
          )}
        </section>
      </div>
    </>
  )
}

function CategoryForm({
  category,
  nextOrder,
  articleCount,
  onClose,
}: {
  category?: Category
  nextOrder: number
  articleCount: number
  onClose: () => void
}) {
  const toast = useToast()
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  // While creating, the slug follows the name until the admin edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const [icon, setIcon] = useState(category?.icon ?? 'file-text')
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pending = create.isPending || update.isPending

  function changeName(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Bitte gib einen Namen ein (mindestens 2 Zeichen).'
    if (!slugify(slug)) next.slug = 'Bitte gib eine Adresse (Slug) ein, z. B. netzwerk-vpn.'
    setErrors(next)
    if (next.name || next.slug) return

    const input = { name, slug, icon }
    try {
      if (category) await update.mutateAsync({ id: category.id, input })
      else await create.mutateAsync({ input, sortOrder: nextOrder })
      toast({
        title: category ? 'Kategorie gespeichert' : 'Kategorie angelegt',
        description: `„${name.trim()}“`,
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Speichern fehlgeschlagen',
        description: adminErrorMessage(error),
        variant: 'error',
      })
    }
  }

  async function handleDelete() {
    if (!category) return
    try {
      await remove.mutateAsync(category.id)
      toast({ title: 'Kategorie gelöscht', description: `„${category.name}“` })
      onClose()
    } catch (error) {
      toast({
        title: 'Löschen fehlgeschlagen',
        description: adminErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setConfirmDelete(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-[15px] font-semibold">
          {category ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
        </h2>
        {category && <Badge variant="accent">{category.name}</Badge>}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => changeName(e.target.value)}
          error={errors.name}
          maxLength={60}
          placeholder="z. B. Netzwerk & VPN"
        />
        <TextField
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setSlugTouched(true)
          }}
          error={errors.slug}
          maxLength={60}
          className="font-mono"
          hint="Teil der Adresse, nur Kleinbuchstaben, Zahlen und Bindestriche."
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-medium text-fg-muted">Symbol</legend>
          <div className="flex flex-wrap gap-2">
            {categoryIconNames.map((iconName) => {
              const Icon = getCategoryIcon(iconName)
              const active = icon === iconName
              return (
                <button
                  key={iconName}
                  type="button"
                  aria-pressed={active}
                  aria-label={getCategoryIconLabel(iconName)}
                  title={getCategoryIconLabel(iconName)}
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    'grid size-10 place-items-center rounded-xl border transition',
                    active
                      ? 'border-accent bg-accent-soft text-accent-hi shadow-[0_0_0_2px_var(--accent-soft)]'
                      : 'border-line bg-hover text-fg-muted hover:border-line-2 hover:text-fg',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </fieldset>

        <p className="text-xs text-fg-subtle">
          Die Reihenfolge änderst du mit den Pfeilen in der Liste.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t bg-surface px-5 py-4">
        {category ? (
          <div className="flex flex-col gap-1">
            <Button
              variant="danger"
              size="sm"
              disabled={articleCount > 0 || remove.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Löschen
            </Button>
            {articleCount > 0 && (
              <span className="text-xs text-fg-subtle">Enthält {articleCount} Artikel</span>
            )}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Kategorie löschen?"
        description={`„${category?.name ?? ''}“ wird dauerhaft entfernt. Das lässt sich nicht rückgängig machen.`}
        confirmLabel="Endgültig löschen"
        pending={remove.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  )
}
