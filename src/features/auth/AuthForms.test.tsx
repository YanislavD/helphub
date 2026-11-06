// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm, RegisterForm } from './AuthForms'
import * as api from './api'

// The forms talk to Supabase through ./api – replace the network calls, keep the real error messages.
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  signIn: vi.fn(),
  signUp: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(api.signIn).mockReset()
  vi.mocked(api.signUp).mockReset()
})

describe('LoginForm', () => {
  it('validates before calling the server', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /Anmelden/ }))

    expect(screen.getByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeInTheDocument()
    expect(screen.getByText('Bitte gib dein Passwort ein.')).toBeInTheDocument()
    expect(api.signIn).not.toHaveBeenCalled()
  })

  it('signs in with the trimmed e-mail address', async () => {
    const user = userEvent.setup()
    vi.mocked(api.signIn).mockResolvedValue(undefined)
    render(<LoginForm />)

    await user.type(
      screen.getByLabelText('Firmen-E-Mail'),
      '  anna.weber@mueller-logistik.example ',
    )
    await user.type(screen.getByLabelText('Passwort'), 'geheim123')
    await user.click(screen.getByRole('button', { name: /Anmelden/ }))

    expect(api.signIn).toHaveBeenCalledWith('anna.weber@mueller-logistik.example', 'geheim123')
  })

  it('shows a friendly German message when the credentials are wrong', async () => {
    const user = userEvent.setup()
    vi.mocked(api.signIn).mockRejectedValue({ code: 'invalid_credentials' })
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Firmen-E-Mail'), 'a@b.de')
    await user.type(screen.getByLabelText('Passwort'), 'falsch')
    await user.click(screen.getByRole('button', { name: /Anmelden/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-Mail oder Passwort ist falsch.')
  })

  it('disables the button while signing in', async () => {
    const user = userEvent.setup()
    vi.mocked(api.signIn).mockReturnValue(new Promise(() => {})) // never finishes
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Firmen-E-Mail'), 'a@b.de')
    await user.type(screen.getByLabelText('Passwort'), 'geheim123')
    await user.click(screen.getByRole('button', { name: /Anmelden/ }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Wird angemeldet/ })).toBeDisabled(),
    )
  })
})

describe('RegisterForm', () => {
  it('requires a name, a valid e-mail and a password of at least 8 characters', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Passwort'), 'kurz')
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(screen.getByText('Bitte gib deinen Namen ein.')).toBeInTheDocument()
    expect(screen.getByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeInTheDocument()
    expect(screen.getByText('Das Passwort braucht mindestens 8 Zeichen.')).toBeInTheDocument()
    expect(api.signUp).not.toHaveBeenCalled()
  })

  it('asks the person to confirm the e-mail when the project requires it', async () => {
    const user = userEvent.setup()
    vi.mocked(api.signUp).mockResolvedValue({ needsConfirmation: true })
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Vollständiger Name'), 'Anna Weber')
    await user.type(screen.getByLabelText('Firmen-E-Mail'), 'anna@mueller-logistik.example')
    await user.type(screen.getByLabelText('Passwort'), 'langes-passwort')
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(await screen.findByText(/bitte E-Mail bestätigen/)).toBeInTheDocument()
    expect(api.signUp).toHaveBeenCalledWith(
      'Anna Weber',
      'anna@mueller-logistik.example',
      'langes-passwort',
    )
  })
})
