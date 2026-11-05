import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/button-styles'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 font-mono text-lg font-semibold text-fg-muted">
        404
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Diese Seite gibt es nicht</h1>
      <p className="text-sm text-fg-muted">
        Der Link ist veraltet oder die Seite wurde verschoben. Starte einfach von vorn.
      </p>
      <Link to="/" className={buttonStyles('primary', 'md') + ' mt-3'}>
        Zur Startseite
      </Link>
    </div>
  )
}
