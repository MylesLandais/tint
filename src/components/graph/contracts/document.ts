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
  ports: GraphPort[]
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
  childIds: string[]
  bounds?: Rect
}

export type GraphDocument = {
  schemaVersion: string
  id: GraphId
  revision: RevisionToken
  nodes: GraphNode[]
  edges: GraphEdge[]
  groups: GraphGroup[]
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
