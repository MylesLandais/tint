import type { GraphDocument } from '../contracts'
import type { ValidationIssue } from '../contracts'

/**
 * The dependency projection: what order the graph runs in, and what is wrong
 * with it if it cannot run at all.
 *
 * The codes and the traversal deliberately mirror the executor's compiler
 * (`lib/auto/src/compiler.rs`, `topological_order`). A client that disagreed
 * with the server about what a valid DAG is would be worse than one that had no
 * opinion: it would draw a lane assignment for a graph the executor refuses.
 * Kahn's algorithm with a *sorted* ready set, same as there, so the order is a
 * function of the document alone and not of insertion order.
 */
export type DependencyProjection = {
  /** Topological order. Empty when the graph does not sort. */
  order: readonly string[]
  /** Longest path from any root, per node. This is the lane index. */
  depthByNodeId: ReadonlyMap<string, number>
  /** Nodes the sort could not reach — the members of one or more cycles. */
  cycleNodeIds: readonly string[]
  issues: readonly ValidationIssue[]
  /** True when `order` covers every node and no issue is an error. */
  acyclic: boolean
}

export function topologicalLanes(document: GraphDocument): DependencyProjection {
  const issues: ValidationIssue[] = []
  const nodeIds = new Set(document.nodes.map((node) => node.id))

  const indegree = new Map<string, number>()
  const outgoing = new Map<string, string[]>()
  for (const id of nodeIds) {
    indegree.set(id, 0)
    outgoing.set(id, [])
  }

  const seenEdgeIds = new Set<string>()
  for (const edge of document.edges) {
    if (seenEdgeIds.has(edge.id)) {
      issues.push({
        code: 'DuplicateEdge',
        message: `edge ${edge.id} is declared more than once`,
        severity: 'error',
        path: `edges/${edge.id}`,
      })
      continue
    }
    seenEdgeIds.add(edge.id)

    for (const endpoint of [edge.source, edge.target]) {
      if (!nodeIds.has(endpoint.nodeId)) {
        issues.push({
          code: 'UnknownEdgeNode',
          message: `edge ${edge.id} references unknown node ${endpoint.nodeId}`,
          severity: 'error',
          path: `edges/${edge.id}`,
        })
      }
    }
    if (!nodeIds.has(edge.source.nodeId) || !nodeIds.has(edge.target.nodeId)) continue

    // A second edge between the same pair is legitimate — two ports, one
    // dependency — but it must not count twice toward the target's indegree, or
    // the target never reaches zero and the whole graph reads as a cycle.
    const targets = outgoing.get(edge.source.nodeId)
    if (targets == null || targets.includes(edge.target.nodeId)) continue
    targets.push(edge.target.nodeId)
    indegree.set(edge.target.nodeId, (indegree.get(edge.target.nodeId) ?? 0) + 1)
  }

  for (const targets of outgoing.values()) targets.sort()

  const remaining = new Map(indegree)
  const ready = [...remaining.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort()

  const order: string[] = []
  const depthByNodeId = new Map<string, number>()
  for (const id of ready) depthByNodeId.set(id, 0)

  while (ready.length > 0) {
    const nodeId = ready.shift() as string
    order.push(nodeId)
    const depth = depthByNodeId.get(nodeId) ?? 0
    for (const target of outgoing.get(nodeId) ?? []) {
      // Longest path, not shortest: a task is scheduled after the *last* of its
      // dependencies, so `max` is the only correct combinator here.
      depthByNodeId.set(target, Math.max(depthByNodeId.get(target) ?? 0, depth + 1))
      const degree = (remaining.get(target) ?? 0) - 1
      remaining.set(target, degree)
      if (degree === 0) {
        ready.push(target)
        ready.sort()
      }
    }
  }

  const cycleNodeIds = [...nodeIds].filter((id) => !order.includes(id)).sort()
  if (cycleNodeIds.length > 0) {
    issues.push({
      code: 'Cycle',
      message: `graph does not sort: ${cycleNodeIds.join(', ')}`,
      severity: 'error',
    })
  }

  return {
    order: cycleNodeIds.length > 0 ? [] : order,
    depthByNodeId,
    cycleNodeIds,
    issues,
    acyclic: cycleNodeIds.length === 0 && !issues.some((issue) => issue.severity === 'error'),
  }
}
