import { useLocation } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'

const titles: Record<string, string> = {
  '/agent': 'Dashboard',
  '/agent/articles': 'Artikel',
  '/agent/articles/new': 'Neuer Artikel',
  '/admin/categories': 'Kategorien',
  '/admin/users': 'Nutzer & Rollen',
}

/** One placeholder for all agent/admin routes – replaced screen by screen in later stages. */
export function AgentPlaceholderPage() {
  const { pathname } = useLocation()
  return (
    <PagePlaceholder
      title={titles[pathname] ?? 'Bereich'}
      description="Dieser Bereich wird in einer späteren Etappe gebaut. Der Zugriff wird dann per Rolle geschützt."
    />
  )
}
