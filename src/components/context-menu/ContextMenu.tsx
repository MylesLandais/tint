import { Menu as BaseMenu } from '@base-ui/react/menu'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type ContextMenuItem = { id: string; label: ReactNode; disabled?: boolean; danger?: boolean; onSelect?: () => void }

export type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  open: boolean
  position: { x: number; y: number } | null
  onOpenChange(open: boolean): void
  items: Array<ContextMenuItem | { type: 'separator'; id: string }>
}

/** Controlled pointer-positioned menu backed by Base UI's focus and typeahead engine. */
export function ContextMenu({ open, position, onOpenChange, items, className, ...props }: ContextMenuProps) {
  if (!position) return null
  const anchor = { getBoundingClientRect: () => new DOMRect(position.x, position.y, 0, 0) }
  return (
    <BaseMenu.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <BaseMenu.Portal>
        <BaseMenu.Positioner anchor={anchor} positionMethod="fixed" side="bottom" align="start" className="z-50">
          <BaseMenu.Popup
            data-context-menu=""
            aria-label="Context menu"
            className={cn('min-w-44 overflow-hidden rounded-lg border border-tint-border bg-tint-panel py-1 shadow-lg outline-none', className)}
            {...props}
          >
            {items.map((item) => 'type' in item ? (
              <BaseMenu.Separator key={item.id} className="my-1 h-px bg-tint-border" />
            ) : (
              <BaseMenu.Item
                key={item.id}
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cn(
                  'flex cursor-default items-center px-3 py-1.5 text-sm text-tint-ink outline-none data-[highlighted]:bg-tint-accent-soft',
                  item.danger && 'text-tint-danger-ink data-[highlighted]:bg-tint-danger-soft',
                  item.disabled && 'opacity-50',
                )}
              >
                {item.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
