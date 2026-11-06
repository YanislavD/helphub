import { use } from 'react'
import { TicketDialogContext } from './ticket-dialog-context'

/** `const { openTicketDialog } = useTicketDialog()` – opens the "create ticket" dialog from anywhere. */
export function useTicketDialog() {
  const ctx = use(TicketDialogContext)
  if (!ctx) throw new Error('useTicketDialog must be used inside <TicketDialogProvider>')
  return ctx
}
