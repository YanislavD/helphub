import { supabase } from '@/lib/supabase'
import type { Ticket, TicketInput } from './types'

const BUCKET = 'ticket-attachments'

/** Keeps the extension, replaces everything unusual – file names end up in a storage path. */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const ext =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 8)
      : ''
  return `${base || 'datei'}${ext ? `.${ext}` : ''}`
}

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
