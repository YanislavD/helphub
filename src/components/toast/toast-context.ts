import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

export interface ToastApi {
  toast: (input: ToastInput) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
