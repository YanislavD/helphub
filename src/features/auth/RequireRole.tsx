import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useAuth } from './useAuth'
import type { Role } from './types'

interface RequireRoleProps {
  /** Which roles may see the children. Omit to just require being signed in. */
  roles?: Role[]
  children: ReactNode
}

/**
 * Route guard. Three outcomes:
 *  1. still loading            → neutral skeleton (no flash of the wrong screen)
 *  2. not signed in            → redirect to /login and remember where the user wanted to go
 *  3. signed in, wrong role    → "no permission" screen
 *
 * This only improves the user experience. The real protection is Row Level Security in the
 * database – anyone can tamper with frontend code, nobody can tamper with Postgres policies.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="grid min-h-screen place-items-center"
        aria-busy="true"
        aria-label="Wird geladen"
      >
        <span className="size-5 animate-spin rounded-full border-2 border-line-2 border-t-accent-hi" />
      </div>
    )
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (roles && (!role || !roles.includes(role))) return <ForbiddenPage />

  return children
}
