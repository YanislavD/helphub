import { createBrowserRouter } from 'react-router-dom'
import { AgentLayout } from '@/layouts/AgentLayout'
import { EmployeeLayout } from '@/layouts/EmployeeLayout'
import { AgentPlaceholderPage } from '@/pages/AgentPlaceholderPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SearchPage } from '@/pages/SearchPage'

/**
 * Route table. Two layouts = two "shells":
 *  - EmployeeLayout: top navigation (everyone)
 *  - AgentLayout: collapsible sidebar (agent/admin) – gets role guards in stage 2
 */
export const router = createBrowserRouter([
  {
    element: <EmployeeLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    element: <AgentLayout />,
    children: [
      { path: 'agent', element: <AgentPlaceholderPage /> },
      { path: 'agent/articles', element: <AgentPlaceholderPage /> },
      { path: 'agent/articles/new', element: <AgentPlaceholderPage /> },
      { path: 'admin/categories', element: <AgentPlaceholderPage /> },
      { path: 'admin/users', element: <AgentPlaceholderPage /> },
    ],
  },
  {
    element: <EmployeeLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
])
