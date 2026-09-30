export type GraphId = string
export type RevisionToken = string

export type Point = { x: number; y: number }
export type Size = { width: number; height: number }
export type Rect = Point & Size

export type GraphViewport = {
  x: number
  y: number
  zoom: number
}

export type TypeReference = {
  ontologyIri?: string
  localName?: string
  mediaType?: string
}

export type NodePresentation = {
  label?: string
  description?: string
  icon?: string
  accent?: string
  collapsed?: boolean
}

export type NodeCapabilities = {
  movable?: boolean
  connectable?: boolean
  deletable?: boolean
  resizable?: boolean
  editable?: boolean
}

export type GraphPort = {
  id: string
  key: string
  direction: 'input' | 'output' | 'bidirectional'
  cardinality: 'single' | 'multiple'
  dataType?: TypeReference
  required?: boolean
}

export type EndpointReference = {
  nodeId: string
  portId: string
}

export type GraphNode<TConfig = unknown> = {
  id: string
  kind: string
  position: Point
  size?: Size
  parentId?: string
  presentation?: NodePresentation
  configuration: TConfig
  ports: readonly GraphPort[]
  capabilities?: NodeCapabilities
}

export type GraphEdge = {
  id: string
  source: EndpointReference
  target: EndpointReference
  kind?: string
  metadata?: Record<string, unknown>
}

export type GraphGroup = {
  id: string
  label?: string
  childIds: readonly string[]
  bounds?: Rect
}

/**
 * The whole graph, as the host owns it.
 *
 * The collections are `readonly` because the document is replaced, never
 * mutated: `revision` is what tells a host something changed, and an in-place
 * `nodes.push` leaves it stale. `derivePorts` and validation already returned
 * `readonly` arrays while these did not, so the discipline stopped exactly where
 * it mattered most.
 */
export type GraphDocument = {
  schemaVersion: string
  id: GraphId
  revision: RevisionToken
  nodes: readonly GraphNode[]
  edges: readonly GraphEdge[]
  groups: readonly GraphGroup[]
  viewport?: GraphViewport
  metadata: Record<string, unknown>
}

export type GraphEntityReference =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'group'; id: string }

export type GraphSelection = {
  nodeIds: ReadonlySet<string>
  edgeIds: ReadonlySet<string>
  groupIds: ReadonlySet<string>
  primary?: GraphEntityReference
}

export function emptySelection(): GraphSelection {
  return {
    nodeIds: new Set(),
    edgeIds: new Set(),
    groupIds: new Set(),
  }
}
