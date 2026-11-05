import ReactMarkdown from 'react-markdown'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkGfm from 'remark-gfm'

/**
 * Renders article Markdown. Used by the live preview in the editor now and by the article
 * page in stage 4, so both always look identical.
 *
 * Safety: react-markdown does NOT render raw HTML by default, so an article can't smuggle in
 * <script> tags (XSS). We deliberately don't enable the raw-HTML plugin.
 */
export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose-hh">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]}>{children}</ReactMarkdown>
    </div>
  )
}
