import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={cn(buttonStyles(variant, size), className)} {...props} />
}
