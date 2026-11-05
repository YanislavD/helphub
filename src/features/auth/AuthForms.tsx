import { ArrowRight, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { authErrorMessage, signIn, signUp } from './api'

function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-err/30 bg-err-soft px-3 py-2 text-[13px] text-err"
    >
      {message}
    </p>
  )
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}
    if (!emailPattern.test(email.trim())) next.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    if (!password) next.password = 'Bitte gib dein Passwort ein.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setPending(true)
    try {
      // On success Supabase fires an auth event; AuthProvider picks it up and the
      // login page redirects – nothing else to do here.
      await signIn(email.trim(), password)
    } catch (error) {
      setFormError(authErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <FormError message={formError} />}
      <TextField
        label="Firmen-E-Mail"
        type="email"
        autoComplete="email"
        placeholder="vorname.nachname@mueller-logistik.de"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <TextField
        label="Passwort"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? 'Wird angemeldet…' : 'Anmelden'}
        {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    </form>
  )
}

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: typeof errors = {}
    if (fullName.trim().length < 2) next.fullName = 'Bitte gib deinen Namen ein.'
    if (!emailPattern.test(email.trim())) next.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    if (password.length < 8) next.password = 'Das Passwort braucht mindestens 8 Zeichen.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return

    setPending(true)
    try {
      const { needsConfirmation } = await signUp(fullName.trim(), email.trim(), password)
      // Without confirmation Supabase signs the user in right away (the login page redirects).
      if (needsConfirmation) setConfirmationSentTo(email.trim())
    } catch (error) {
      setFormError(authErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  if (confirmationSentTo) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-ok/30 bg-ok-soft p-6 text-center">
        <MailCheck className="size-8 text-ok" aria-hidden="true" />
        <h2 className="text-base font-semibold">Fast geschafft – bitte E-Mail bestätigen</h2>
        <p className="text-sm text-fg-muted">
          Wir haben einen Bestätigungslink an{' '}
          <span className="font-medium text-fg">{confirmationSentTo}</span> geschickt. Danach kannst
          du dich anmelden.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <FormError message={formError} />}
      <TextField
        label="Vollständiger Name"
        autoComplete="name"
        placeholder="Anna Weber"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
      />
      <TextField
        label="Firmen-E-Mail"
        type="email"
        autoComplete="email"
        placeholder="vorname.nachname@mueller-logistik.de"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <TextField
        label="Passwort"
        type="password"
        autoComplete="new-password"
        placeholder="Mindestens 8 Zeichen"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="Mindestens 8 Zeichen. Bitte nicht dein Windows-Passwort verwenden."
      />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? 'Konto wird erstellt…' : 'Konto erstellen'}
      </Button>
    </form>
  )
}
