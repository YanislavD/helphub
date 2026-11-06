import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '@/components/toast/ToastProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { TicketDialogProvider } from '@/features/tickets/TicketDialogProvider'
import { queryClient } from '@/lib/queryClient'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <TicketDialogProvider>
            <RouterProvider router={router} />
          </TicketDialogProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
