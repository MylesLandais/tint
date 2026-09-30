import { getContext } from 'svelte'
import type { ToastInput } from '../../../core/toast/model'

export type ToastController = {
  push(toast: ToastInput): string
  dismiss(id: string): void
}

export const toastContextKey = Symbol('tint-toast')

export function useToast(): ToastController {
  const controller = getContext<ToastController | undefined>(toastContextKey)
  if (!controller) throw new Error('useToast must be used within ToastProvider')
  return controller
}
