import { Paperclip, Plus, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useMyTickets } from '@/features/tickets/hooks'
import { useTicketDialog } from '@/features/tickets/useTicketDialog'
import {
  priorityLabels,
  statusLabels,
  type TicketPriority,
  type TicketStatus,
} from '@/features/tickets/types'
import { formatDate } from '@/lib/format'

const statusBadge: Record<TicketStatus, 'warn' | 'accent' | 'ok'> = {
  open: 'warn',
  in_progress: 'accent',
  done: 'ok',
}

const priorityBadge: Record<TicketPriority, 'neutral' | 'accent' | 'warn' | 'err'> = {
  low: 'neutral',
  normal: 'neutral',
  high: 'warn',
  urgent: 'err',
}

/** "Meine Tickets": the tickets the signed-in employee has created (RLS shows only their own). */
export function TicketsPage() {
  const tickets = useMyTickets()
  const { openTicketDialog } = useTicketDialog()

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.028em]">
            Meine Tickets
          </h1>
          <p className="text-sm text-fg-muted">
            {tickets.data ? `${tickets.data.length} Tickets` : 'Wird geladen…'}
          </p>
        </div>
        <Button onClick={() => openTicketDialog()}>
          <Plus className="size-4" aria-hidden="true" />
          Neues Ticket
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {tickets.isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-lg border bg-hover" />
          ))}

        {tickets.isError && (
          <p role="alert" className="text-sm text-err">
            Die Tickets konnten nicht geladen werden. Bitte lade die Seite neu.
          </p>
        )}

        {tickets.data?.map((ticket) => (
          <article key={ticket.id} className="flex flex-col gap-2 rounded-lg border bg-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadge[ticket.status]} dot>
                  {statusLabels[ticket.status]}
                </Badge>
                <Badge variant={priorityBadge[ticket.priority]}>
                  Priorität: {priorityLabels[ticket.priority]}
                </Badge>
              </div>
              <span className="text-xs text-fg-subtle">{formatDate(ticket.created_at)}</span>
            </div>
            <h2 className="text-[17px] font-semibold tracking-tight">{ticket.title}</h2>
            <p className="line-clamp-2 text-[13px] text-fg-muted">{ticket.description}</p>
            {(ticket.attachment_path || ticket.source_query) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
                {ticket.source_query && <span>Suche: „{ticket.source_query}“</span>}
                {ticket.attachment_path && (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="size-3.5" aria-hidden="true" />1 Anhang
                  </span>
                )}
              </div>
            )}
          </article>
        ))}

        {tickets.isSuccess && tickets.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-raised px-6 py-14 text-center">
            <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
              <Ticket className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">Noch keine Tickets</h2>
            <p className="max-w-sm text-sm text-fg-muted">
              Findest du keine Lösung in der Wissensdatenbank, erstelle ein Ticket – das IT-Team
              hilft dir weiter.
            </p>
            <Button className="mt-3" onClick={() => openTicketDialog()}>
              Ticket erstellen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
