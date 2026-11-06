import { safeFileName } from '@/lib/safe-file-name'
import { supabase } from '@/lib/supabase'
import type { Ticket, TicketInput } from './types'

const BUCKET = 'ticket-attachments'

/**
 * Creates a ticket, optionally with one attachment.
 *
 * The ticket id is generated here so the file can be stored under <user>/<ticket>/<name> BEFORE the
 * row exists. If saving the row fails after the upload, the file is removed again (no orphans).
 */
export async function createTicket(
  input: TicketInput,
  userId: string,
  file: File | null,
): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  let attachmentPath: string | null = null

  if (file) {
    attachmentPath = `${userId}/${id}/${safeFileName(file.name)}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(attachmentPath, file, { contentType: file.type, upsert: false })
    if (error) throw error
  }

  const { error } = await supabase.from('ticket_requests').insert({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    source_query: input.sourceQuery ?? null,
    source_article_id: input.sourceArticleId ?? null,
    attachment_path: attachmentPath,
  })

  if (error) {
    if (attachmentPath) await supabase.storage.from(BUCKET).remove([attachmentPath])
    throw error
  }
  return { id }
}

export async function fetchMyTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('ticket_requests')
    .select('id, title, description, priority, status, source_query, attachment_path, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Ticket[]
}
