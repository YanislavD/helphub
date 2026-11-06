export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'done'

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
}

export const priorityHints: Record<TicketPriority, string> = {
  low: 'Kein Zeitdruck, ich kann gut weiterarbeiten.',
  normal: 'Es stört, aber ich kann weiterarbeiten.',
  high: 'Ich kann nicht arbeiten, andere sind nicht betroffen.',
  urgent: 'Mehrere Kolleginnen und Kollegen oder der Betrieb sind betroffen.',
}

export const statusLabels: Record<TicketStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  done: 'Erledigt',
}

export interface TicketInput {
  title: string
  description: string
  priority: TicketPriority
  sourceQuery?: string | null
  sourceArticleId?: string | null
}

export interface Ticket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  source_query: string | null
  attachment_path: string | null
  created_at: string
}

/** Attachment rules – mirror the bucket settings in the migration (Storage enforces them too). */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
]
