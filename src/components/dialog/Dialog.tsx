import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'

export type DialogProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  open: boolean
  onOpenChange(open: boolean): void
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  hideClose?: boolean
}

/** Controlled, focus-trapped modal backed by Base UI. */
export function Dialog({ open, onOpenChange, title, description, actions, hideClose = false, className, children, ...props }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-tint-ink/40" />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            data-dialog=""
            className={cn('flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-lg outline-none', className)}
            {...props}
          >
            <header className="flex items-start gap-3 border-b border-tint-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <BaseDialog.Title className="text-base font-semibold text-tint-ink">{title}</BaseDialog.Title>
                {description ? <BaseDialog.Description className="mt-1 text-sm text-tint-muted">{description}</BaseDialog.Description> : null}
              </div>
              {hideClose ? null : (
                <BaseDialog.Close aria-label="Close" className="rounded-md p-1 text-tint-muted transition hover:bg-tint-surface hover:text-tint-ink">
                  <Icon icon={X} size="sm" />
                </BaseDialog.Close>
              )}
            </header>
            <div className="min-h-0 flex-1 overflow-auto px-4 py-3 text-sm text-tint-ink">{children}</div>
            {actions ? <footer className="flex flex-wrap justify-end gap-2 border-t border-tint-border px-4 py-3">{actions}</footer> : null}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
