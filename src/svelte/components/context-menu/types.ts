import type { HTMLAttributes } from 'svelte/elements'
import type { MenuItem, MenuSeparator } from '../menu/types'

export type ContextMenuItem = MenuItem
export type ContextMenuSeparator = MenuSeparator

export type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  open: boolean
  position: { x: number; y: number } | null
  onOpenChange: (open: boolean) => void
  items: readonly (ContextMenuItem | ContextMenuSeparator)[]
}
