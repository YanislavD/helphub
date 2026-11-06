import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TicketDialog } from './TicketDialog'
import { TicketDialogContext, type TicketDialogOptions } from './ticket-dialog-context'

/** Holds the single ticket dialog of the app; any page can open it with useTicketDialog(). */
export function TicketDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<TicketDialogOptions | null>(null)
  // Changes on every opening so the form inside is rebuilt from scratch (fresh state, new prefill).
  const [openCount, setOpenCount] = useState(0)

  const openTicketDialog = useCallback((next: TicketDialogOptions = {}) => {
    setOptions(next)
    setOpenCount((count) => count + 1)
  }, [])

  const value = useMemo(() => ({ openTicketDialog }), [openTicketDialog])

  return (
    <TicketDialogContext value={value}>
      {children}
      <TicketDialog key={openCount} options={options} onClose={() => setOptions(null)} />
    </TicketDialogContext>
  )
}
