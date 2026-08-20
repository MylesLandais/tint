import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from '../button'
import { cn } from '../../lib/utils'

export type SelectionToolbarAction = {
  id: string
  label: string
  icon?: ReactNode
  danger?: boolean
}

export type SelectionToolbarProps = HTMLAttributes<HTMLDivElement> & {
  /** Viewport-relative position for the floating bar. */
  position: { x: number; y: number } | null
  open: boolean
  actions: readonly SelectionToolbarAction[]
  onAction: (actionId: string) => void
}

/**
 * Floating selection actions. Host measures selection and supplies `position`;
 * the toolbar never reads `window.getSelection()` itself so SSR and tests stay
 * deterministic.
 */
export function SelectionToolbar({
  position,
  open,
  actions,
  onAction,
  className,
  ...props
}: SelectionToolbarProps) {
  if (!open || !position) return null

  return (
    <div
      data-tint-selection-toolbar=""
      role="toolbar"
      aria-label="Selection actions"
      className={cn(
        'fixed z-40 flex -translate-x-1/2 -translate-y-full gap-1 rounded-lg border border-tint-border bg-tint-panel p-1 shadow-md',
        className,
      )}
      style={{ left: position.x, top: position.y }}
      {...props}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          variant={action.danger ? 'danger' : 'ghost'}
          leading={action.icon}
          onClick={() => onAction(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
