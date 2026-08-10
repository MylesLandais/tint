/**
 * Focused typings for the vendored xyflow ESM bundle.
 *
 * Only the surface tint's graph adapter imports is declared here. Full upstream
 * declaration trees are intentionally not vendored — they resolve module IDs
 * (`@xyflow/system`, `zustand`) that do not exist after bundling.
 */

import type {
  ComponentType,
  CSSProperties,
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'

export type XYPosition = { x: number; y: number }

export type Position = 'left' | 'top' | 'right' | 'bottom'
export declare const Position: {
  readonly Left: 'left'
  readonly Top: 'top'
  readonly Right: 'right'
  readonly Bottom: 'bottom'
}

export type MarkerType = 'arrow' | 'arrowclosed'
export declare const MarkerType: {
  readonly Arrow: 'arrow'
  readonly ArrowClosed: 'arrowclosed'
}

export type BackgroundVariant = 'lines' | 'dots' | 'cross'
export declare const BackgroundVariant: {
  readonly Lines: 'lines'
  readonly Dots: 'dots'
  readonly Cross: 'cross'
}

export type Node<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TType extends string | undefined = string | undefined,
> = {
  id: string
  position: XYPosition
  data: TData
  type?: TType
  selected?: boolean
  draggable?: boolean
  selectable?: boolean
  connectable?: boolean
  deletable?: boolean
  width?: number
  height?: number
  style?: CSSProperties
  className?: string
  zIndex?: number
}

export type Edge<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TType extends string | undefined = string | undefined,
> = {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: TType
  data?: TData
  selected?: boolean
  animated?: boolean
  label?: ReactNode
  style?: CSSProperties
  className?: string
  markerEnd?: string | { type: MarkerType; color?: string; width?: number; height?: number }
}

export type Connection = {
  source: string | null
  target: string | null
  sourceHandle: string | null
  targetHandle: string | null
}

export type NodeChange =
  | { type: 'position'; id: string; position?: XYPosition; dragging?: boolean }
  | { type: 'dimensions'; id: string; dimensions?: { width: number; height: number } }
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; item: Node }
  | { type: 'replace'; id: string; item: Node }

export type EdgeChange =
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; item: Edge }
  | { type: 'replace'; id: string; item: Edge }

export type OnNodesChange = (changes: NodeChange[]) => void
export type OnEdgesChange = (changes: EdgeChange[]) => void
export type OnConnect = (connection: Connection) => void
export type OnSelectionChangeParams = {
  nodes: Node[]
  edges: Edge[]
}

export type NodeProps<TData extends Record<string, unknown> = Record<string, unknown>> = {
  id: string
  data: TData
  selected?: boolean
  dragging?: boolean
  type?: string
  zIndex?: number
  selectable?: boolean
  deletable?: boolean
  draggable?: boolean
  isConnectable?: boolean
}

export type NodeTypes = Record<string, ComponentType<NodeProps>>

export type Viewport = { x: number; y: number; zoom: number }

export type ReactFlowInstance = {
  fitView: (options?: { padding?: number; duration?: number }) => Promise<boolean>
  setViewport: (viewport: Viewport, options?: { duration?: number }) => Promise<boolean>
  getViewport: () => Viewport
  getNodes: () => Node[]
  getEdges: () => Edge[]
  screenToFlowPosition: (position: XYPosition) => XYPosition
  flowToScreenPosition: (position: XYPosition) => XYPosition
}

export type ReactFlowProps = {
  nodes?: Node[]
  edges?: Edge[]
  nodeTypes?: NodeTypes
  onNodesChange?: OnNodesChange
  onEdgesChange?: OnEdgesChange
  onConnect?: OnConnect
  onNodeClick?: (event: ReactMouseEvent, node: Node) => void
  onNodeDragStart?: (event: ReactMouseEvent, node: Node, nodes: Node[]) => void
  onNodeDragStop?: (event: ReactMouseEvent, node: Node, nodes: Node[]) => void
  onEdgeClick?: (event: ReactMouseEvent, edge: Edge) => void
  onPaneClick?: (event: ReactMouseEvent) => void
  onSelectionChange?: (params: OnSelectionChangeParams) => void
  onMoveEnd?: (event: MouseEvent | TouchEvent | null, viewport: Viewport) => void
  fitView?: boolean
  fitViewOptions?: { padding?: number }
  nodesDraggable?: boolean
  nodesConnectable?: boolean
  elementsSelectable?: boolean
  panOnDrag?: boolean | number[]
  panOnScroll?: boolean
  zoomOnScroll?: boolean
  zoomOnPinch?: boolean
  selectionOnDrag?: boolean
  minZoom?: number
  maxZoom?: number
  defaultViewport?: Viewport
  proOptions?: { hideAttribution?: boolean }
  className?: string
  style?: CSSProperties
  children?: ReactNode
  colorMode?: 'light' | 'dark' | 'system'
  deleteKeyCode?: string | string[] | null
  multiSelectionKeyCode?: string | string[] | null
  onInit?: (instance: ReactFlowInstance) => void
}

export declare const ReactFlow: ComponentType<ReactFlowProps>
export declare const ReactFlowProvider: ComponentType<{ children?: ReactNode }>

export declare const Handle: ComponentType<
  HTMLAttributes<HTMLDivElement> & {
    type: 'source' | 'target'
    position: Position
    id?: string
    isConnectable?: boolean
  }
>

export declare const Background: ComponentType<{
  variant?: BackgroundVariant | 'lines' | 'dots' | 'cross'
  gap?: number | [number, number]
  size?: number
  color?: string
  className?: string
}>

export declare const Controls: ComponentType<{
  showZoom?: boolean
  showFitView?: boolean
  showInteractive?: boolean
  className?: string
  onFitView?: () => void
}>

export declare const MiniMap: ComponentType<{
  nodeStrokeWidth?: number
  nodeColor?: string | ((node: Node) => string)
  maskColor?: string
  className?: string
  pannable?: boolean
  zoomable?: boolean
}>

export declare const Panel: ComponentType<
  HTMLAttributes<HTMLDivElement> & {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
>

export declare function applyNodeChanges(changes: NodeChange[], nodes: Node[]): Node[]
export declare function applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[]
export declare function addEdge(connection: Connection | Edge, edges: Edge[]): Edge[]

export declare function useReactFlow(): ReactFlowInstance
export declare function useNodes(): Node[]
export declare function useEdges(): Edge[]
export declare function useViewport(): Viewport
export declare function useNodesState(initial: Node[]): [
  Node[],
  (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
  OnNodesChange,
]
export declare function useEdgesState(initial: Edge[]): [
  Edge[],
  (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  OnEdgesChange,
]
