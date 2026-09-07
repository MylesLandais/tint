import { Toast as BaseToast } from '@base-ui/react/toast'
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
export type ToastInput = { title: string; description?: string; tone?: ToastTone; durationMs?: number }
type ToastData = { tone: ToastTone }
type ToastContextValue = { push(toast: ToastInput): string; dismiss(id: string): void }

const ToastContext = createContext<ToastContextValue | null>(null)
const TONE_CLASS: Record<ToastTone, string> = {
  neutral: 'border-tint-border', success: 'border-tint-success/40', warning: 'border-tint-warning/40', danger: 'border-tint-danger/40', info: 'border-tint-info/40',
}

export type ToastProviderProps = { children: ReactNode; limit?: number }

export function ToastProvider({ children, limit = 3 }: ToastProviderProps) {
  return <BaseToast.Provider limit={limit}><ToastBridge>{children}</ToastBridge></BaseToast.Provider>
}

function ToastBridge({ children }: { children: ReactNode }) {
  const manager = BaseToast.useToastManager<ToastData>()
  const push = useCallback((toast: ToastInput) => manager.add({
    title: toast.title,
    description: toast.description,
    type: toast.tone ?? 'neutral',
    timeout: toast.durationMs ?? 4000,
    priority: toast.tone === 'danger' ? 'high' : 'low',
    data: { tone: toast.tone ?? 'neutral' },
  }), [manager])
  const dismiss = useCallback((id: string) => manager.close(id), [manager])
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
          {manager.toasts.map((toast) => {
            const tone = toast.data?.tone ?? 'neutral'
            return (
              <BaseToast.Root
                key={toast.id}
                toast={toast}
                data-tone={tone}
                role="status"
                className={cn('rounded-lg border bg-tint-panel px-3 py-2 shadow-lg', TONE_CLASS[tone])}
              >
                <BaseToast.Content className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <BaseToast.Title className="text-sm font-medium text-tint-ink" />
                    <BaseToast.Description className="mt-0.5 text-xs text-tint-muted" />
                  </div>
                  <BaseToast.Close aria-label="Dismiss" className="rounded p-0.5 text-tint-muted hover:text-tint-ink">
                    <Icon icon={X} size="xs" />
                  </BaseToast.Close>
                </BaseToast.Content>
              </BaseToast.Root>
            )
          })}
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
