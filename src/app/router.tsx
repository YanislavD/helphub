import { createBrowserRouter } from 'react-router-dom'
import { RequireRole } from '@/features/auth/RequireRole'
import { AgentLayout } from '@/layouts/AgentLayout'
import { EmployeeLayout } from '@/layouts/EmployeeLayout'
import { AgentPlaceholderPage } from '@/pages/AgentPlaceholderPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'

/**
 * Route table. Layouts are "shells" around groups of pages:
 *  - EmployeeLayout: top navigation. Browsing the portal needs a login (RequireRole without roles).
 *  - AgentLayout: collapsible sidebar, only for agent + admin.
 *  - /admin/* additionally requires the admin role.
 *  - /login has its own full-screen layout and is public.
 */
export const router = createBrowserRouter([
  { path: 'login', element: <LoginPage /> },
  {
    element: (
      <RequireRole>
        <EmployeeLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
    ],
  },
  {
    element: (
      <RequireRole roles={['agent', 'admin']}>
        <AgentLayout />
      </RequireRole>
    ),
    children: [
      { path: 'agent', element: <AgentPlaceholderPage /> },
      { path: 'agent/articles', element: <AgentPlaceholderPage /> },
      { path: 'agent/articles/new', element: <AgentPlaceholderPage /> },
      {
        path: 'admin/categories',
        element: (
          <RequireRole roles={['admin']}>
            <AgentPlaceholderPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireRole roles={['admin']}>
            <AgentPlaceholderPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
