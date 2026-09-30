export type TreeStructureNode = { id: string; children?: readonly TreeStructureNode[] }

export type VisibleTreeEntry = {
  id: string
  parentId: string | null
  depth: number
  hasChildren: boolean
  firstChildId: string | null
}

export function toTreeSet(ids: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  return new Set(ids ?? [])
}

export function toggleTreeId(ids: ReadonlySet<string> | readonly string[], id: string): string[] {
  const next = toTreeSet(ids)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return [...next]
}

/** Flatten only rendered nodes; parent links make ArrowLeft navigation deterministic. */
export function visibleTreeEntries(
  nodes: readonly TreeStructureNode[],
  expandedIds: ReadonlySet<string> | readonly string[],
): VisibleTreeEntry[] {
  const expanded = toTreeSet(expandedIds)
  const entries: VisibleTreeEntry[] = []
  function visit(branches: readonly TreeStructureNode[], parentId: string | null, depth: number) {
    for (const node of branches) {
      const hasChildren = (node.children?.length ?? 0) > 0
      entries.push({ id: node.id, parentId, depth, hasChildren, firstChildId: node.children?.[0]?.id ?? null })
      if (hasChildren && expanded.has(node.id)) visit(node.children!, node.id, depth + 1)
    }
  }
  visit(nodes, null, 0)
  return entries
}
