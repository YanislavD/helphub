// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthState } from './auth-context'
import { RequireRole } from './RequireRole'
import type { Role } from './types'

function state(overrides: Partial<AuthState> = {}): AuthState {
  return { session: null, user: null, profile: null, role: null, loading: false, ...overrides }
}

function signedIn(role: Role): AuthState {
  return state({
    user: { id: 'user-1' } as User,
    profile: { id: 'user-1', full_name: 'Test', role },
    role,
  })
}

function LoginSpy() {
  const location = useLocation()
  return <div>LOGIN {location.search}</div>
}

function renderGuard(auth: AuthState, roles?: Role[]) {
  return render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={['/agent/articles?x=1']}>
        <Routes>
          <Route path="/login" element={<LoginSpy />} />
          <Route
            path="/agent/articles"
            element={
              <RequireRole roles={roles}>
                <div>GEHEIMER BEREICH</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )
}

describe('RequireRole', () => {
  it('shows a neutral loading state while the session is being checked', () => {
    renderGuard(state({ loading: true }), ['agent'])
    expect(screen.getByLabelText('Wird geladen')).toBeInTheDocument()
    expect(screen.queryByText('GEHEIMER BEREICH')).not.toBeInTheDocument()
  })

  it('sends signed-out visitors to /login and remembers where they wanted to go', () => {
    renderGuard(state(), ['agent'])
    expect(screen.getByText(/LOGIN/)).toHaveTextContent('redirect=%2Fagent%2Farticles%3Fx%3D1')
  })

  it('shows the "no permission" screen for the wrong role', () => {
    renderGuard(signedIn('user'), ['agent', 'admin'])
    expect(screen.getByText('Dafür fehlt dir die Berechtigung')).toBeInTheDocument()
    expect(screen.queryByText('GEHEIMER BEREICH')).not.toBeInTheDocument()
  })

  it.each<Role>(['agent', 'admin'])('lets %s in', (role) => {
    renderGuard(signedIn(role), ['agent', 'admin'])
    expect(screen.getByText('GEHEIMER BEREICH')).toBeInTheDocument()
  })

  it('lets every signed-in user in when no roles are required', () => {
    renderGuard(signedIn('user'))
    expect(screen.getByText('GEHEIMER BEREICH')).toBeInTheDocument()
  })

  it('keeps admin-only areas closed for agents', () => {
    renderGuard(signedIn('agent'), ['admin'])
    expect(screen.getByText('Dafür fehlt dir die Berechtigung')).toBeInTheDocument()
  })
})
