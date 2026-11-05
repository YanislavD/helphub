import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { signOut } from './api'
import { useAuth } from './useAuth'
import { roleLabels } from './types'

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6d7bff,#8e4df0)] text-xs font-semibold text-white"
    >
      {initials(name)}
    </span>
  )
}

/** Right side of the employee header: login link when signed out, name + sign-out when signed in. */
export function AccountControls({ compact = false }: { compact?: boolean }) {
  const { user, profile, role, loading } = useAuth()

  if (loading) return <span className="h-8 w-24 animate-pulse rounded-sm bg-hover-2" />

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex h-8 items-center rounded-sm px-3 text-[13px] font-medium text-fg-muted transition hover:bg-hover-2 hover:text-fg"
      >
        Anmelden
      </Link>
    )
  }

  const name = profile?.full_name || user.email || ''

  return (
    <div className={compact ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5'}>
      <Avatar name={name} />
      {!compact && (
        <div className="hidden flex-col sm:flex">
          <span className="text-[13px] leading-4 font-semibold">{name}</span>
          <span className="text-xs leading-4 text-fg-subtle">{role ? roleLabels[role] : ''}</span>
        </div>
      )}
      <Button variant="ghost" size="icon-sm" onClick={() => void signOut()} aria-label="Abmelden">
        <LogOut className="size-[18px]" />
      </Button>
    </div>
  )
}
