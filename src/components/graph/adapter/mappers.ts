import type { Edge, Node } from '../../../vendor/xyflow'
import type { GraphDocument, GraphNode, GraphSelection } from '../contracts'

/**
 * What the shell needs to render before the node view takes over.
 *
 * Deliberately small. It used to carry `graphNodeId` (the flow node's own `id`),
 * `description`, `category`, `portSummary` and the whole `configuration`, none
 * of which anything read — and `configuration` in particular meant every node's
 * full config was copied into flow state on every document revision.
 */
export type GraphFlowNodeData = {
  kind: string
  label: string
  accent?: string
}

export type GraphFlowNode = Node<GraphFlowNodeData, 'tint'>
export type GraphFlowEdge = Edge<Record<string, unknown>, 'default'>

export function toFlowNodes(document: GraphDocument): GraphFlowNode[] {
  return document.nodes.map((node) => ({
    id: node.id,
    type: 'tint',
    position: { ...node.position },
    data: {
      kind: node.kind,
      label: node.presentation?.label ?? node.kind,
      accent: node.presentation?.accent,
    },
    draggable: node.capabilities?.movable !== false,
    selectable: true,
    connectable: node.capabilities?.connectable !== false,
    deletable: node.capabilities?.deletable !== false,
    style: node.size
      ? { width: node.size.width, height: node.size.height }
      : undefined,
  }))
}

export function toFlowEdges(document: GraphDocument): GraphFlowEdge[] {
  return document.edges.map((edge) => ({
    id: edge.id,
    source: edge.source.nodeId,
    target: edge.target.nodeId,
    sourceHandle: handleId(edge.source.portId, 'source'),
    targetHandle: handleId(edge.target.portId, 'target'),
    type: 'default',
    data: edge.metadata ? { kind: edge.kind, ...edge.metadata } : { kind: edge.kind },
    markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
  }))
}

export function selectionFromFlow(
  nodes: readonly Node[],
  edges: readonly Edge[],
): GraphSelection {
  const selectedNodes = nodes.filter((node) => node.selected)
  const selectedEdges = edges.filter((edge) => edge.selected)
  const nodeIds = new Set(selectedNodes.map((node) => node.id))
  const edgeIds = new Set(selectedEdges.map((edge) => edge.id))
  const primary =
    selectedNodes[0] != null
      ? ({ kind: 'node', id: selectedNodes[0].id } as const)
      : selectedEdges[0] != null
        ? ({ kind: 'edge', id: selectedEdges[0].id } as const)
        : undefined

  return { nodeIds, edgeIds, groupIds: new Set(), primary }
}

/**
 * xyflow identifies a handle by id alone, so a `'bidirectional'` port — which
 * renders as both a target and a source — put the same id on two handles, and a
 * connection landing on one could resolve to the other.
 *
 * Every handle is suffixed with its side rather than only the ambiguous ones:
 * the id a handle carries then never depends on the port's direction, so
 * changing a port to bidirectional cannot silently renumber its neighbours.
 * Document-level `portId`s are untouched — {@link portIdFromHandle} converts back.
 */
export function handleId(portId: string, side: HandleSide): string {
  return `${portId}${SIDE_SEPARATOR}${side}`
}

/** Undo {@link handleId} — what an incoming connection means in document terms. */
export function portIdFromHandle(handle: string | null | undefined): string {
  if (!handle) return ''
  for (const side of HANDLE_SIDES) {
    const suffix = `${SIDE_SEPARATOR}${side}`
    if (handle.endsWith(suffix)) return handle.slice(0, -suffix.length)
  }
  return handle
}

type HandleSide = (typeof HANDLE_SIDES)[number]
const HANDLE_SIDES = ['source', 'target'] as const
const SIDE_SEPARATOR = '::'

export function indexNodesById(
  document: GraphDocument,
): ReadonlyMap<string, GraphNode> {
  return new Map(document.nodes.map((node) => [node.id, node]))
}
