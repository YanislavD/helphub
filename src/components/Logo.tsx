import { Link } from 'react-router-dom'

interface LogoProps {
  /** Show only the mark (used in the collapsed sidebar). */
  compact?: boolean
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="HelpHub – Startseite"
      className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight"
    >
      <span className="grid size-7 place-items-center rounded-sm bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_70%,#fff),var(--accent)_55%,color-mix(in_srgb,var(--accent)_60%,#6a2bff))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_6px_16px_-6px_var(--accent)]">
        <svg
          viewBox="0 0 24 24"
          className="size-[18px] fill-none stroke-current stroke-[1.9]"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M8 6v12M16 6v12M8 12h8" />
        </svg>
      </span>
      {!compact && <span>HelpHub</span>}
    </Link>
  )
}
