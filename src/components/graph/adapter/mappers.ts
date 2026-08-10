import type { Edge, Node } from '../../../vendor/xyflow'
import type { GraphDocument, GraphEdge, GraphNode, GraphSelection } from '../contracts'

export type GraphFlowNodeData = {
  graphNodeId: string
  kind: string
  label: string
  description?: string
  accent?: string
  category?: string
  portSummary: string
  configuration: unknown
}

export type GraphFlowNode = Node<GraphFlowNodeData, 'tint'>
export type GraphFlowEdge = Edge<Record<string, unknown>, 'default'>

export function toFlowNodes(document: GraphDocument): GraphFlowNode[] {
  return document.nodes.map((node) => ({
    id: node.id,
    type: 'tint',
    position: { ...node.position },
    data: {
      graphNodeId: node.id,
      kind: node.kind,
      label: node.presentation?.label ?? node.kind,
      description: node.presentation?.description,
      accent: node.presentation?.accent,
      portSummary: formatPortSummary(node),
      configuration: node.configuration,
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
    sourceHandle: edge.source.portId,
    targetHandle: edge.target.portId,
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

export function findGraphNode(
  document: GraphDocument,
  nodeId: string,
): GraphNode | undefined {
  return document.nodes.find((node) => node.id === nodeId)
}

export function findGraphEdge(
  document: GraphDocument,
  edgeId: string,
): GraphEdge | undefined {
  return document.edges.find((edge) => edge.id === edgeId)
}

function formatPortSummary(node: GraphNode): string {
  const inputs = node.ports.filter((port) => port.direction !== 'output').length
  const outputs = node.ports.filter((port) => port.direction !== 'input').length
  return `${inputs} in · ${outputs} out`
}
