import {
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutDashboard,
  PanelLeft,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { AccountControls } from '@/features/auth/AccountControls'
import { cn } from '@/lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const mainItems: NavItem[] = [
  { to: '/agent', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/agent/articles', label: 'Artikel', icon: FileText },
  { to: '/agent/articles/new', label: 'Neuer Artikel', icon: Plus },
]

const adminItems: NavItem[] = [
  { to: '/admin/categories', label: 'Kategorien', icon: FolderOpen },
  { to: '/admin/users', label: 'Nutzer & Rollen', icon: Users },
]

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex h-9 items-center gap-2.5 rounded-sm text-sm transition',
          collapsed ? 'size-10 justify-center' : 'w-full px-2.5',
          isActive ? 'bg-hover-2 text-fg' : 'text-fg-muted hover:bg-hover-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[18px]', isActive && 'text-accent-hi')} aria-hidden="true" />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

/** Collapsible sidebar layout for agents and admins (design screens 6–9). */
export function AgentLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <SupabaseNotice />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            'flex shrink-0 flex-col gap-1 border-b bg-surface p-3 transition-[width] duration-200 md:min-h-full md:border-r md:border-b-0',
            collapsed ? 'md:w-16 md:items-center' : 'md:w-62',
          )}
        >
          <div
            className={cn(
              'flex items-center pb-3',
              collapsed ? 'justify-center' : 'justify-between px-1.5',
            )}
          >
            <Logo compact={collapsed} />
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden md:inline-flex"
                onClick={() => setCollapsed(true)}
                aria-label="Seitenleiste einklappen"
              >
                <PanelLeft className="size-[18px]" />
              </Button>
            )}
          </div>

          <nav aria-label="Agent-Navigation" className="flex flex-col gap-1">
            {mainItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
            {collapsed ? (
              <hr className="my-2 w-6 self-center" />
            ) : (
              <span className="px-2.5 pt-4 pb-1.5 text-xs font-medium tracking-wider text-fg-subtle uppercase">
                Verwaltung
              </span>
            )}
            {adminItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </nav>

          <div className="hidden flex-1 md:block" />

          <div className={cn('hidden flex-col gap-1 md:flex', collapsed && 'items-center')}>
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                aria-label="Seitenleiste ausklappen"
              >
                <PanelLeft className="size-[18px]" />
              </Button>
            )}
            <NavLink
              to="/"
              title={collapsed ? 'Mitarbeiteransicht' : undefined}
              aria-label={collapsed ? 'Mitarbeiteransicht' : undefined}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-sm text-sm text-fg-muted transition hover:bg-hover-2 hover:text-fg',
                collapsed ? 'size-10 justify-center' : 'w-full px-2.5',
              )}
            >
              <ExternalLink className="size-[18px]" aria-hidden="true" />
              {!collapsed && <span>Mitarbeiteransicht</span>}
            </NavLink>
            <div
              className={cn(
                'flex items-center gap-2',
                collapsed ? 'flex-col' : 'justify-between px-1.5 pt-2',
              )}
            >
              <AccountControls compact={collapsed} />
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
