import { createContext } from 'react'

export interface TicketDialogOptions {
  /** Pre-filled title, e.g. the text the person searched for. */
  title?: string
  /** What the person searched for before giving up – stored with the ticket. */
  sourceQuery?: string
  /** The article that did not help. */
  sourceArticleId?: string
}

export interface TicketDialogApi {
  openTicketDialog: (options?: TicketDialogOptions) => void
}

export const TicketDialogContext = createContext<TicketDialogApi | null>(null)
