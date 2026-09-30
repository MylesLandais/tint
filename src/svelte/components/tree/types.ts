import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

export type TreeNode = {
  id: string
  label: string | Snippet
  /** Text name for a rich label snippet. */
  labelText?: string
  children?: readonly TreeNode[]
  trailing?: string | Snippet
}

export type TreeViewProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  nodes: readonly TreeNode[]
  expandedIds: ReadonlySet<string> | readonly string[]
  onExpandedChange: (expandedIds: string[]) => void
  selectedIds?: ReadonlySet<string> | readonly string[]
  onSelectedChange?: (selectedIds: string[]) => void
}
