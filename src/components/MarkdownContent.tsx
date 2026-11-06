import ReactMarkdown from 'react-markdown'
import { remarkAlert } from 'remark-github-blockquote-alert'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

/**
 * Renders article Markdown. Used by the live preview in the editor and by the article
 * page, so both always look identical.
 *
 * - rehype-slug gives every heading an id (so "On this page" links can jump to it).
 * - Safety: react-markdown does NOT render raw HTML by default, so an article can't smuggle in
 *   <script> tags (XSS). We deliberately don't enable the raw-HTML plugin.
 */
export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose-hh">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]} rehypePlugins={[rehypeSlug]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
