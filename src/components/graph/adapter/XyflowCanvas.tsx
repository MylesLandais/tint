import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnSelectionChangeParams,
  type Viewport,
} from '../../../vendor/xyflow'
import type {
  GraphCommand,
  GraphDocument,
  GraphSelection,
  GraphViewport,
  NodeRegistry,
  Point,
} from '../contracts'
import { emptySelection } from '../contracts'
import { TintFlowNode } from './TintFlowNode'
import {
  selectionFromFlow,
  toFlowEdges,
  toFlowNodes,
  type GraphFlowNodeData,
} from './mappers'

export type XyflowCanvasProps = {
  document: GraphDocument
  registry: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onNodePositionsCommit?: (positions: Record<string, Point>) => void
  onCommand?: (command: GraphCommand) => void
  className?: string
}

function XyflowCanvasInner({
  document,
  registry,
  readonly = false,
  selection,
  onSelectionChange,
  onViewportChange,
  onNodePositionsCommit,
  onCommand,
  className,
}: XyflowCanvasProps) {
  const { fitView, setViewport, getViewport } = useReactFlow()
  const [nodes, setNodes] = useState<Node[]>(() => toFlowNodes(document))
  const [edges, setEdges] = useState<Edge[]>(() => toFlowEdges(document))
  const nodesRef = useRef(nodes)
  const dragBaseline = useRef<Map<string, Point>>(new Map())
  const lastSelectionKey = useRef('')

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    setNodes(toFlowNodes(document))
    setEdges(toFlowEdges(document))
  }, [document])

  useEffect(() => {
    if (!document.viewport) {
      void fitView({ padding: 0.2 })
      return
    }
    void setViewport(document.viewport, { duration: 0 })
  }, [document.id, document.revision, document.viewport, fitView, setViewport])

  useEffect(() => {
    if (!selection) return
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: selection.nodeIds.has(node.id),
      })),
    )
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        selected: selection.edgeIds.has(edge.id),
      })),
    )
  }, [selection])

  const nodeTypes = useMemo(() => {
    const TintNode = (props: NodeProps<GraphFlowNodeData>) => (
      <TintFlowNode
        {...props}
        document={document}
        registry={registry}
        readonly={readonly}
        dispatch={(command) => onCommand?.(command)}
      />
    )
    TintNode.displayName = 'TintGraphNode'
    return { tint: TintNode as ComponentType<NodeProps> }
  }, [document, onCommand, readonly, registry])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((current) => applyNodeChanges(changes, current))

      for (const change of changes) {
        if (change.type !== 'position') continue

        if (change.dragging) {
          if (!dragBaseline.current.has(change.id)) {
            const existing = nodesRef.current.find((node) => node.id === change.id)
            if (existing) {
              dragBaseline.current.set(change.id, { ...existing.position })
            }
          }
          continue
        }

        // Drag ended (or a non-drag position update). Commit moved nodes.
        if (dragBaseline.current.size === 0) continue

        const latest = applyNodeChanges(changes, nodesRef.current)
        const positions: Record<string, Point> = {}
        for (const [id, origin] of dragBaseline.current) {
          const next = latest.find((node) => node.id === id)?.position
          if (!next) continue
          if (next.x !== origin.x || next.y !== origin.y) {
            positions[id] = { ...next }
          }
        }
        dragBaseline.current.clear()

        if (Object.keys(positions).length === 0) continue
        onNodePositionsCommit?.(positions)
        onCommand?.({
          type: 'node.move',
          nodeIds: Object.keys(positions),
          positions,
        })
      }
    },
    [onCommand, onNodePositionsCommit],
  )

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current))
  }, [])

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const next = selectionFromFlow(params.nodes, params.edges)
      const key = selectionKey(next)
      if (key === lastSelectionKey.current) return
      lastSelectionKey.current = key
      onSelectionChange?.(next)
      onCommand?.({ type: 'selection.replace', selection: next })
    },
    [onCommand, onSelectionChange],
  )

  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      onViewportChange?.(viewport)
      onCommand?.({ type: 'viewport.set', viewport })
    },
    [onCommand, onViewportChange],
  )

  const handlePaneClick = useCallback(
    (_event: ReactMouseEvent) => {
      const cleared = emptySelection()
      lastSelectionKey.current = selectionKey(cleared)
      onSelectionChange?.(cleared)
      onCommand?.({ type: 'selection.replace', selection: cleared })
    },
    [onCommand, onSelectionChange],
  )

  return (
    <ReactFlow
      className={className}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={readonly ? undefined : onNodesChange}
      onEdgesChange={onEdgesChange}
      onSelectionChange={handleSelectionChange}
      onMoveEnd={handleMoveEnd}
      onPaneClick={handlePaneClick}
      nodesDraggable={!readonly}
      nodesConnectable={!readonly}
      elementsSelectable
      fitView={!document.viewport}
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.25}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={readonly ? null : ['Backspace', 'Delete']}
      onInit={() => {
        onViewportChange?.(getViewport())
      }}
    >
      <Background gap={18} size={1} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable nodeStrokeWidth={2} />
    </ReactFlow>
  )
}

export function XyflowCanvas(props: XyflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <XyflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function selectionKey(selection: GraphSelection): string {
  const nodes = [...selection.nodeIds].sort().join(',')
  const edges = [...selection.edgeIds].sort().join(',')
  return `${nodes}|${edges}`
}
