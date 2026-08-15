import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  /** Auto-dismiss delay in ms. `0` keeps it until dismissed. Default 4000. */
  durationMs?: number
}

type ToastRecord = ToastInput & { id: string }

type ToastContextValue = {
  push: (toast: ToastInput) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_CLASS: Record<ToastTone, string> = {
  neutral: 'border-tint-border',
  success: 'border-tint-success/40',
  warning: 'border-tint-warning/40',
  danger: 'border-tint-danger/40',
  info: 'border-tint-info/40',
}

export type ToastProviderProps = {
  children: ReactNode
}

/** Host for ephemeral toasts. Place once near the app root. */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID()
      const durationMs = toast.durationMs ?? 4000
      setToasts((current) => [...current, { ...toast, id }])
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div
              data-toast-viewport=""
              className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
              aria-live="polite"
            >
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  role="status"
                  data-toast=""
                  data-tone={toast.tone ?? 'neutral'}
                  className={cn(
                    'pointer-events-auto rounded-lg border bg-tint-panel px-3 py-2 shadow-lg',
                    TONE_CLASS[toast.tone ?? 'neutral'],
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-tint-ink">{toast.title}</p>
                      {toast.description ? (
                        <p className="mt-0.5 text-xs text-tint-muted">{toast.description}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      className="rounded p-0.5 text-tint-muted hover:text-tint-ink"
                      onClick={() => dismiss(toast.id)}
                    >
                      <Icon icon={X} size="xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}

/** Push and dismiss toasts from any descendant of `ToastProvider`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
