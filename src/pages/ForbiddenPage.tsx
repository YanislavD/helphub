import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/button-styles'

export function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-warn/30 bg-warn-soft text-warn">
          <Lock className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Dafür fehlt dir die Berechtigung</h1>
        <p className="text-sm text-fg-muted">
          Dieser Bereich ist für IT-Agents und Admins. Wenn du glaubst, dass das ein Fehler ist,
          melde dich beim IT-Team.
        </p>
        <Link to="/" className={buttonStyles('primary', 'md') + ' mt-3'}>
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  )
}
