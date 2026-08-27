import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export type ContextMenuItem = {
  id: string
  label: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect?: () => void
}

export type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Whether the menu is visible. */
  open: boolean
  /** Screen coordinates for the menu origin. */
  position: { x: number; y: number } | null
  /** Called when the menu should close. */
  onOpenChange: (open: boolean) => void
  /** Menu entries. Separators use `type: 'separator'`. */
  items: Array<ContextMenuItem | { type: 'separator'; id: string }>
}

/** Controlled context menu positioned at pointer coordinates. */
export function ContextMenu({
  open,
  position,
  onOpenChange,
  items,
  className,
  ...props
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus()
  }, [open, position])

  if (!open || !position || typeof document === 'undefined') return null

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const itemsEls = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    )
    const index = itemsEls.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      itemsEls[(index + 1) % itemsEls.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      itemsEls[(index - 1 + itemsEls.length) % itemsEls.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      itemsEls[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      itemsEls[itemsEls.length - 1]?.focus()
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      data-context-menu=""
      tabIndex={-1}
      onKeyDown={onMenuKeyDown}
      className={cn(
        'fixed z-50 min-w-44 overflow-hidden rounded-lg border border-tint-border bg-tint-panel py-1 shadow-lg outline-none',
        className,
      )}
      style={{ left: position.x, top: position.y }}
      {...props}
    >
      {items.map((item) => {
        if ('type' in item && item.type === 'separator') {
          return (
            <div
              key={item.id}
              role="separator"
              aria-orientation="horizontal"
              className="my-1 h-px bg-tint-border"
            />
          )
        }
        const entry = item as ContextMenuItem
        return (
          <button
            key={entry.id}
            type="button"
            role="menuitem"
            disabled={entry.disabled}
            aria-disabled={entry.disabled || undefined}
            className={cn(
              'flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-sm outline-none transition',
              entry.danger ? 'text-tint-danger-ink hover:bg-tint-danger-soft' : 'text-tint-ink hover:bg-tint-accent-soft',
              entry.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
            )}
            onClick={() => {
              if (entry.disabled) return
              entry.onSelect?.()
              onOpenChange(false)
            }}
          >
            {entry.label}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
