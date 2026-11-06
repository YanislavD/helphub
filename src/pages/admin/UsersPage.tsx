import { Search, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/toast/useToast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { useChangeRole, useUsers } from '@/features/admin/hooks'
import type { AdminUser } from '@/features/admin/api'
import { adminErrorMessage, filterUsers } from '@/features/admin/utils'
import { Avatar } from '@/features/auth/AccountControls'
import { roleLabels, type Role } from '@/features/auth/types'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'

const roleFilters: Array<{ value: Role | 'all'; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'user', label: 'Mitarbeiter' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
]

const roles: Role[] = ['user', 'agent', 'admin']

/** Admin: see everybody and change roles (design screen 9, right part). */
export function UsersPage() {
  const toast = useToast()
  const { user: me } = useAuth()
  const users = useUsers()
  const changeRole = useChangeRole()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  // A role change that needs an explicit "yes" first (to or from admin).
  const [pending, setPending] = useState<{ user: AdminUser; role: Role } | null>(null)

  const visible = filterUsers(users.data ?? [], search, roleFilter)

  async function apply(target: AdminUser, role: Role) {
    try {
      await changeRole.mutateAsync({ userId: target.id, role })
      toast({
        title: 'Rolle geändert',
        description: `${target.full_name || target.email}: ${roleLabels[role]}`,
      })
    } catch (error) {
      toast({
        title: 'Rolle nicht geändert',
        description: adminErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setPending(null)
    }
  }

  function requestChange(target: AdminUser, role: Role) {
    if (role === target.role) return
    // Granting or taking away admin rights is serious → ask first. Everything else applies at once.
    if (role === 'admin' || target.role === 'admin') setPending({ user: target, role })
    else void apply(target, role)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Nutzer &amp; Rollen</h1>
          <p className="text-[13px] text-fg-muted">
            {users.data ? `${users.data.length} Konten` : 'Wird geladen…'}
          </p>
        </div>
        <Badge variant="accent">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Nur für Admins
        </Badge>
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-full items-center gap-2 rounded-md border border-line-2 bg-field px-3 transition focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)] sm:w-80">
            <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <label htmlFor="user-search" className="sr-only">
              Nutzer suchen
            </label>
            <input
              id="user-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div
            role="group"
            aria-label="Rolle filtern"
            className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
          >
            {roleFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={roleFilter === f.value}
                onClick={() => setRoleFilter(f.value)}
                className={cn(
                  'h-[30px] rounded-[7px] px-3 text-[13px] transition',
                  roleFilter === f.value
                    ? 'border bg-overlay text-fg shadow-sm'
                    : 'border border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {users.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-err/30 bg-err-soft p-4 text-sm text-err"
          >
            <span>Die Nutzer konnten nicht geladen werden.</span>
            <Button variant="secondary" size="sm" onClick={() => void users.refetch()}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {!users.isError && (
          <div className="overflow-x-auto rounded-lg border bg-raised">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-surface text-left text-xs font-medium text-fg-subtle">
                  <th className="px-4 py-3">Nutzer</th>
                  <th className="w-52 px-4 py-3">Rolle</th>
                  <th className="px-4 py-3">Registriert</th>
                  <th className="px-4 py-3">Letzte Anmeldung</th>
                </tr>
              </thead>
              <tbody>
                {users.isPending &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={4} className="px-4 py-3.5">
                        <div className="h-8 animate-pulse rounded-sm bg-hover-2" />
                      </td>
                    </tr>
                  ))}

                {visible.map((u) => {
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id} className="border-b transition last:border-0 hover:bg-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name || u.email} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] font-semibold">
                              {u.full_name || '–'}
                              {isMe && <Badge className="ml-2">Du</Badge>}
                            </span>
                            <span className="truncate text-xs text-fg-subtle">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {isMe ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="accent">{roleLabels[u.role]}</Badge>
                            <span className="text-xs text-fg-subtle">
                              eigene Rolle nicht änderbar
                            </span>
                          </div>
                        ) : (
                          <Select
                            label={`Rolle von ${u.full_name || u.email}`}
                            hideLabel
                            value={u.role}
                            disabled={changeRole.isPending}
                            onChange={(e) => requestChange(u, e.target.value as Role)}
                            className="h-8 text-[13px]"
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-fg-muted">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-fg-muted">
                        {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'noch nie'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {users.isSuccess && visible.length === 0 && (
              <p className="px-6 py-12 text-center text-sm text-fg-muted">Keine Nutzer gefunden.</p>
            )}
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3.5 text-sm text-fg-muted">
          <TriangleAlert className="mt-0.5 size-[18px] shrink-0 text-warn" aria-hidden="true" />
          <p>
            <b className="font-semibold text-fg">Rollen wirken sofort.</b> Agents können Artikel
            bearbeiten und Statistiken sehen, Admins zusätzlich Kategorien und Rollen ändern. Es
            bleibt immer mindestens ein Admin.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.role === 'admin' ? 'Zum Admin machen?' : 'Admin-Rechte entziehen?'}
        description={
          pending?.role === 'admin'
            ? `${pending.user.full_name || pending.user.email} darf danach Kategorien und alle Rollen verwalten.`
            : `${pending?.user.full_name || pending?.user.email} verliert die Admin-Rechte und wird zu „${pending ? roleLabels[pending.role] : ''}“.`
        }
        confirmLabel="Rolle ändern"
        onConfirm={() => pending && void apply(pending.user, pending.role)}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
