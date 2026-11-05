import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border border-transparent font-medium leading-none transition duration-150 disabled:pointer-events-none disabled:opacity-45'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_18px_-8px_var(--accent)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_10px_24px_-8px_var(--accent)] active:translate-y-0',
  secondary: 'border-line-2 bg-overlay text-fg hover:border-fg/30 hover:bg-hover-2',
  ghost: 'text-fg-muted hover:bg-hover-2 hover:text-fg',
  danger: 'border-err/30 bg-err-soft text-err hover:bg-err/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-sm px-3 text-[13px]',
  md: 'h-10 rounded-md px-4 text-sm',
  lg: 'h-12 rounded-xl px-5 text-[15px]',
  icon: 'size-10 rounded-md',
  'icon-sm': 'size-8 rounded-sm',
}

/** Class string for buttons – also usable on <Link> so links can look like buttons. */
export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return cn(base, variants[variant], sizes[size])
}
