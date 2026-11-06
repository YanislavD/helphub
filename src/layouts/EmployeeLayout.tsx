import { Bell } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { AccountControls } from '@/features/auth/AccountControls'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

const baseLinks = [
  { to: '/', label: 'Startseite', end: true },
  { to: '/search', label: 'Alle Artikel', end: false },
  { to: '/tickets', label: 'Meine Tickets', end: false },
]

/** Simple top navigation for employees (design screens 2–5). */
export function EmployeeLayout() {
  const { role } = useAuth()
  // Agents and admins get a shortcut into their area; the guard in the router still decides access.
  const links =
    role === 'agent' || role === 'admin'
      ? [...baseLinks, { to: '/agent', label: 'Agent-Bereich', end: false }]
      : baseLinks

  return (
    <div className="min-h-screen">
      <SupabaseNotice />
      <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b bg-bg/80 px-4 backdrop-blur-md sm:px-6">
        <Logo />
        <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex h-9 items-center rounded-sm px-3 text-sm transition',
                  isActive ? 'bg-hover-2 text-fg' : 'text-fg-muted hover:bg-hover-2 hover:text-fg',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Benachrichtigungen">
          <Bell className="size-[18px]" />
        </Button>
        <AccountControls />
      </header>
      <Outlet />
    </div>
  )
}
