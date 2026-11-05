import { Construction } from 'lucide-react'

interface PagePlaceholderProps {
  title: string
  description: string
}

/** Temporary page body until the real screen is built in its stage. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-2 px-6 py-24 text-center">
      <span className="mb-2 grid size-14 place-items-center rounded-2xl border border-line-2 bg-hover-2 text-fg-muted">
        <Construction className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-fg-muted">{description}</p>
    </div>
  )
}
