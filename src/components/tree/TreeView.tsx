import { ChevronRight } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

export type TreeNode = {
  id: string
  label: ReactNode
  children?: TreeNode[]
  /** Optional trailing content (priority select, size, …). */
  trailing?: ReactNode
}

export type TreeViewProps = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
  nodes: TreeNode[]
  /** Expanded node ids. Host owns expansion state. */
  expandedIds: ReadonlySet<string> | readonly string[]
  onExpandedChange: (expandedIds: string[]) => void
  /** Optional selection set for checkbox trees. */
  selectedIds?: ReadonlySet<string> | readonly string[]
  onSelectedChange?: (selectedIds: string[]) => void
}

function toSet(value: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  if (!value) return new Set()
  return value instanceof Set ? new Set(value) : new Set(value)
}

function TreeBranch({
  node,
  depth,
  expanded,
  selected,
  onToggleExpand,
  onToggleSelect,
  selectable,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  selected: Set<string>
  onToggleExpand: (id: string) => void
  onToggleSelect?: (id: string) => void
  selectable: boolean
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selected.has(node.id)

  return (
    <li data-tree-node="" data-expanded={isExpanded || undefined}>
      <div
        className="flex min-h-8 items-center gap-1 rounded-md px-1 text-sm text-tint-ink hover:bg-tint-accent-soft"
        style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="rounded p-0.5 text-tint-muted hover:text-tint-ink"
            onClick={() => onToggleExpand(node.id)}
          >
            <Icon
              icon={ChevronRight}
              size="xs"
              className={cn('transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="inline-block w-4" aria-hidden="true" />
        )}
        {selectable ? (
          <input
            type="checkbox"
            className="size-3.5 accent-[var(--tint-accent)]"
            checked={isSelected}
            onChange={() => onToggleSelect?.(node.id)}
            aria-label={typeof node.label === 'string' ? node.label : 'Select'}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {node.trailing ? <span className="shrink-0 text-xs text-tint-muted">{node.trailing}</span> : null}
      </div>
      {hasChildren && isExpanded ? (
        <ul role="group" className="m-0 list-none p-0">
          {node.children!.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              selectable={selectable}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** Controlled expandable tree. Host owns expanded and selected id sets. */
export function TreeView({
  nodes,
  expandedIds,
  onExpandedChange,
  selectedIds,
  onSelectedChange,
  className,
  ...props
}: TreeViewProps) {
  const expanded = toSet(expandedIds)
  const selected = toSet(selectedIds)
  const selectable = Boolean(onSelectedChange)

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onExpandedChange([...next])
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange?.([...next])
  }

  return (
    <ul
      role="tree"
      data-tree-view=""
      className={cn('m-0 list-none p-0', className)}
      {...props}
    >
      {nodes.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          selected={selected}
          onToggleExpand={toggleExpand}
          onToggleSelect={toggleSelect}
          selectable={selectable}
        />
      ))}
    </ul>
  )
}
