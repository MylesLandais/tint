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
  ValidationIssue,
} from '../contracts'
import { emptySelection } from '../contracts'
import { GraphAdapterProvider } from './GraphAdapterContext'
import { TintFlowNode } from './TintFlowNode'
import {
  selectionFromFlow,
  toFlowEdges,
  toFlowNodes,
} from './mappers'

export type XyflowCanvasProps = {
  document: GraphDocument
  registry: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  validationByNodeId?: ReadonlyMap<string, readonly ValidationIssue[]>
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onNodePositionsCommit?: (positions: Record<string, Point>) => void
  onCommand?: (command: GraphCommand) => void
  className?: string
}

/** Stable nodeTypes map — reads document/registry via context, not closures. */
const nodeTypes: Record<string, ComponentType<NodeProps>> = {
  tint: TintFlowNode as ComponentType<NodeProps>,
}

function XyflowCanvasInner({
  document,
  registry,
  readonly = false,
  selection,
  validationByNodeId,
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
  const documentRef = useRef(document)
  documentRef.current = document

  const resolvedValidation = useMemo(
    () => validationByNodeId ?? new Map<string, readonly ValidationIssue[]>(),
    [validationByNodeId],
  )

  const dispatch = useCallback(
    (command: GraphCommand) => {
      onCommand?.(command)
    },
    [onCommand],
  )

  const adapterValue = useMemo(
    () => ({
      document,
      registry,
      readonly,
      dispatch,
      validationByNodeId: resolvedValidation,
    }),
    [dispatch, document, readonly, registry, resolvedValidation],
  )

  useEffect(() => {
    const nextNodes = toFlowNodes(document)
    const nextEdges = toFlowEdges(document)
    nodesRef.current = nextNodes
    setNodes(nextNodes)
    setEdges(nextEdges)
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
    setNodes((current) => {
      const next = current.map((node) => ({
        ...node,
        selected: selection.nodeIds.has(node.id),
      }))
      nodesRef.current = next
      return next
    })
    setEdges((current) =>
      current.map((edge) => ({
        ...edge,
        selected: selection.edgeIds.has(edge.id),
      })),
    )
  }, [selection])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => {
      const latest = applyNodeChanges(changes, current)
      nodesRef.current = latest
      return latest
    })
  }, [])

  const handleNodeDragStart = useCallback((_event: ReactMouseEvent, _node: Node, dragNodes: Node[]) => {
    dragBaseline.current = new Map(
      dragNodes.map((node) => {
        const docNode = documentRef.current.nodes.find((item) => item.id === node.id)
        const origin = docNode?.position ?? node.position
        return [node.id, { ...origin }] as const
      }),
    )
  }, [])

  const handleNodeDragStop = useCallback(
    (_event: ReactMouseEvent, _node: Node, dragNodes: Node[]) => {
      const positions: Record<string, Point> = {}
      for (const node of dragNodes) {
        const origin = dragBaseline.current.get(node.id)
        if (!origin) continue
        if (node.position.x !== origin.x || node.position.y !== origin.y) {
          positions[node.id] = { ...node.position }
        }
      }
      dragBaseline.current.clear()
      if (Object.keys(positions).length === 0) return
      onNodePositionsCommit?.(positions)
      onCommand?.({
        type: 'node.move',
        nodeIds: Object.keys(positions),
        positions,
      })
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
    <GraphAdapterProvider value={adapterValue}>
      <ReactFlow
        className={className}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={readonly ? undefined : onNodesChange}
        onNodeDragStart={readonly ? undefined : handleNodeDragStart}
        onNodeDragStop={readonly ? undefined : handleNodeDragStop}
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
    </GraphAdapterProvider>
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
