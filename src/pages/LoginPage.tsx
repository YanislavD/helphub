import { Check, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoginForm, RegisterForm } from '@/features/auth/AuthForms'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

type Mode = 'login' | 'register'

/** Only allow redirects to paths inside our own app (blocks "open redirect" tricks like //evil.com). */
function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

const benefits = [
  'Suche in normaler Sprache – keine Fachbegriffe nötig',
  'Schritt-für-Schritt-Anleitungen vom IT-Team',
  'Nicht gelöst? Ticket in einem Klick erstellen',
]

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [params] = useSearchParams()
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to={safeRedirect(params.get('redirect'))} replace />

  return (
    <div className="flex min-h-screen flex-col">
      <SupabaseNotice />
      <div className="flex flex-1 flex-wrap">
        {/* Left: form */}
        <div className="flex min-h-[640px] min-w-0 flex-[1_1_480px] flex-col px-6 py-8 sm:px-12">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="flex w-full max-w-[400px] flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.028em]">
                  Willkommen bei HelpHub
                </h1>
                <p className="text-[15px] text-fg-muted">
                  Melde dich an, um Lösungen für deine IT-Probleme zu finden.
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Anmelden oder registrieren"
                className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
              >
                {(
                  [
                    ['login', 'Anmelden'],
                    ['register', 'Registrieren'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => setMode(value)}
                    className={cn(
                      'h-[30px] flex-1 rounded-[7px] text-[13px] transition',
                      mode === value
                        ? 'border bg-overlay text-fg shadow-sm'
                        : 'border border-transparent text-fg-muted hover:text-fg',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>

          <p className="text-xs text-fg-subtle">© Müller Logistik GmbH · IT-Service</p>
        </div>

        {/* Right: value statement (hidden on small screens) */}
        <div className="relative hidden min-w-0 flex-[1_1_480px] items-center justify-center overflow-hidden border-l bg-surface p-12 md:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_srgb,var(--accent)_24%,transparent),transparent_72%)]" />
          <div className="relative flex w-full max-w-[520px] flex-col gap-10">
            <div className="flex flex-col gap-4">
              <span className="inline-flex h-[22px] items-center gap-1.5 self-start rounded-full border border-accent-line bg-accent-soft px-2.5 text-xs font-medium text-accent-hi">
                <Sparkles className="size-3.5" aria-hidden="true" />
                KI-gestützte Suche
              </span>
              <h2 className="text-[44px] leading-[48px] font-semibold tracking-[-0.04em]">
                Sag uns, was nicht funktioniert. Wir finden die Lösung.
              </h2>
              <p className="text-[17px] leading-7 text-fg-muted">
                Beschreibe dein Problem in eigenen Worten. HelpHub findet die passende Anleitung –
                und wenn nicht, ist das Ticket nur einen Klick entfernt.
              </p>
            </div>

            <div className="rounded-lg border bg-raised/85 p-4 shadow-card backdrop-blur-md">
              <div className="flex h-12 items-center gap-2 rounded-md border border-accent bg-field px-3 shadow-[0_0_0_3px_var(--accent-soft)]">
                <Search className="size-[18px] text-fg-subtle" aria-hidden="true" />
                <span className="text-[15px]">Ich komme nicht in meinen PC rein</span>
              </div>
              <p className="mt-3 rounded-md bg-hover-2 px-3 py-2.5 text-[13px]">
                <span className="font-semibold">Windows-Passwort zurücksetzen</span>
                <span className="ml-2 text-fg-subtle">Konten &amp; Passwörter</span>
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {benefits.map((text) => (
                <li key={text} className="flex items-center gap-3 text-[15px] text-fg-muted">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent-line bg-accent-soft text-accent-hi">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
