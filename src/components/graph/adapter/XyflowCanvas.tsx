import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
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
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnNodeDrag,
  type OnSelectionChangeParams,
  type Viewport,
} from '../../../vendor/xyflow'
import type {
  GraphCommand,
  GraphDocument,
  GraphEntityReference,
  GraphSelection,
  GraphViewport,
  NodeRegistry,
  NodeRuntimeSummary,
  Point,
  ValidationIssue,
} from '../contracts'
import { emptySelection } from '../contracts'
import { GraphAdapterProvider } from './GraphAdapterContext'
import { TintFlowNode } from './TintFlowNode'
import {
  indexNodesById,
  mergeFlowNodesFromDocument,
  portIdFromHandle,
  selectionFromFlow,
  toFlowEdges,
  toFlowNodes,
  type GraphFlowNode,
} from './mappers'

export type XyflowCanvasProps = {
  document: GraphDocument
  registry: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  validationByNodeId?: ReadonlyMap<string, readonly ValidationIssue[]>
  runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
  /** Optional host-driven camera (e.g. follow a mock execution). */
  viewport?: GraphViewport
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onCommand?: (command: GraphCommand) => void
  className?: string
}

/** Long enough to read as movement, short enough not to lag a stepping run. */
const FOLLOW_TWEEN_MS = 180

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
  runtimeByNodeId,
  viewport,
  onSelectionChange,
  onViewportChange,
  onCommand,
  className,
}: XyflowCanvasProps) {
  const { fitView, setViewport, getViewport } = useReactFlow()
  const [nodes, setNodes] = useState<GraphFlowNode[]>(() => toFlowNodes(document))
  const [edges, setEdges] = useState<Edge[]>(() => toFlowEdges(document))
  const dragBaseline = useRef<Map<string, Point>>(new Map())
  const lastSelectionKey = useRef('')
  const lastViewportGraphId = useRef<string | null>(null)
  const lastFollowKey = useRef('')
  /**
   * The document as of the last commit, for the drag handlers — a pointer drag
   * must diff against where the node started, not where a re-render put it.
   *
   * Written in an effect, not during render: React may render without
   * committing, and the previous version also kept a `nodesRef` and an
   * `edgesRef` written in eight places and read in none.
   */
  const documentRef = useRef(document)
  useEffect(() => {
    documentRef.current = document
  }, [document])

  const resolvedValidation = useMemo(
    () => validationByNodeId ?? new Map<string, readonly ValidationIssue[]>(),
    [validationByNodeId],
  )
  const resolvedRuntime = useMemo(
    () => runtimeByNodeId ?? new Map<string, NodeRuntimeSummary>(),
    [runtimeByNodeId],
  )

  const dispatch = useCallback(
    (command: GraphCommand) => {
      onCommand?.(command)
    },
    [onCommand],
  )

  const nodesById = useMemo(() => indexNodesById(document), [document])

  const [poppedNodeIds, setPoppedNodeIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const togglePopped = useCallback((nodeId: string) => {
    setPoppedNodeIds((current) => {
      const next = new Set(current)
      if (!next.delete(nodeId)) next.add(nodeId)
      return next
    })
  }, [])

  const adapterValue = useMemo(
    () => ({
      document,
      nodesById,
      registry,
      poppedNodeIds,
      togglePopped,
      readonly,
      dispatch,
      validationByNodeId: resolvedValidation,
      runtimeByNodeId: resolvedRuntime,
    }),
    [
      dispatch,
      document,
      nodesById,
      poppedNodeIds,
      readonly,
      registry,
      resolvedRuntime,
      resolvedValidation,
      togglePopped,
    ],
  )

  // Sync graph document → flow nodes/edges. Preserve measured dimensions so
  // xyflow does not re-measure in a loop after every configure/move revision.
  // While a drag is open, keep live positions so a mid-gesture document update
  // cannot fight the pointer.
  useEffect(() => {
    const draggingIds = new Set(dragBaseline.current.keys())
    setNodes((current) => mergeFlowNodesFromDocument(document, current, draggingIds))
    setEdges((current) => {
      const previous = new Map(current.map((edge) => [edge.id, edge]))
      const next = toFlowEdges(document).map((edge) => {
        const prior = previous.get(edge.id)
        return {
          ...prior,
          ...edge,
          selected: prior?.selected ?? false,
        }
      })
      return next
    })
  }, [document])

  useEffect(() => {
    if (!selection) return
    const key = selectionKey(selection)
    setNodes((current) => {
      let changed = false
      const next = current.map((node) => {
        const selected = selection.nodeIds.has(node.id)
        if (node.selected === selected) return node
        changed = true
        return { ...node, selected }
      })
      return changed ? next : current
    })
    setEdges((current) => {
      let changed = false
      const next = current.map((edge) => {
        const selected = selection.edgeIds.has(edge.id)
        if (edge.selected === selected) return edge
        changed = true
        return { ...edge, selected }
      })
      return changed ? next : current
    })
    lastSelectionKey.current = key
  }, [selection])

  /**
   * Fit or apply the *authored* camera, once per graph.
   *
   * The guard is on identity alone, which is what this has always claimed to do.
   * It used to read `id === current && !document.viewport`, so a document that
   * had a viewport never took the early return — and since a pan wrote a fresh
   * `document.viewport` back through `applyCommand`, this effect re-applied it
   * with `setViewport`, xyflow fired `onMoveEnd` for that programmatic move
   * (d3's transform carries `sourceEvent: null`, and the end handler only
   * ignores `sourceEvent.internal`), and the pan handler emitted another
   * `viewport.set`. One drag on the canvas started a loop that never stopped.
   *
   * `document.viewport` is deliberately not a dependency: it is read here, not
   * reacted to. The host drives the camera through the `viewport` prop below.
   */
  useEffect(() => {
    if (lastViewportGraphId.current === document.id) return
    lastViewportGraphId.current = document.id
    if (!documentRef.current.viewport) {
      void fitView({ padding: 0.2 })
      return
    }
    void setViewport(documentRef.current.viewport, { duration: 0 })
  }, [document.id, fitView, setViewport])

  /**
   * Host-driven camera (e.g. following a run). Keyed so an identical frame is a
   * no-op rather than a re-tween.
   *
   * Clearing the prop resets the key: without that, a host that panned manually
   * and then re-sent the frame it was last on got nothing, because the key still
   * matched from before the pan.
   */
  useEffect(() => {
    if (!viewport) {
      lastFollowKey.current = ''
      return
    }
    const key = `${viewport.x}:${viewport.y}:${viewport.zoom}`
    if (key === lastFollowKey.current) return
    lastFollowKey.current = key
    void setViewport(viewport, { duration: FOLLOW_TWEEN_MS })
  }, [setViewport, viewport])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => {
      const latest = applyNodeChanges(changes, current)
      return latest
    })
  }, [])

  const handleNodeDragStart: OnNodeDrag = useCallback((_event, _node, dragNodes) => {
    dragBaseline.current = new Map(
      dragNodes.map((node) => {
        const docNode = documentRef.current.nodes.find((item) => item.id === node.id)
        const origin = docNode?.position ?? node.position
        return [node.id, { ...origin }] as const
      }),
    )
  }, [])

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, _node, dragNodes) => {
      const positions: Record<string, Point> = {}
      for (const node of dragNodes) {
        const origin = dragBaseline.current.get(node.id)
        if (!origin) continue
        if (node.position.x !== origin.x || node.position.y !== origin.y) {
          positions[node.id] = { ...node.position }
        }
      }
      dragBaseline.current.clear()

      /**
       * One command, one application. This used to also call an
       * `onNodePositionsCommit` prop, which `InteractiveGraphView` reduced with
       * `applyCommand` in a second handler — against the same, not-yet-updated
       * `document` — so a single drag built two documents, fired
       * `onDocumentChange` twice, and threw the first result away.
       */
      if (Object.keys(positions).length > 0) {
        onCommand?.({
          type: 'node.move',
          nodeIds: Object.keys(positions),
          positions,
        })
      }

      // Auto-pan during the drag suppressed viewport.set; commit the camera once.
      const live = getViewport()
      const authored = documentRef.current.viewport
      if (
        !authored ||
        authored.x !== live.x ||
        authored.y !== live.y ||
        authored.zoom !== live.zoom
      ) {
        onViewportChange?.(live)
        onCommand?.({ type: 'viewport.set', viewport: live })
      }
    },
    [getViewport, onCommand, onViewportChange],
  )

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => {
      const latest = applyEdgeChanges(changes, current)
      return latest
    })
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
    (_event: MouseEvent | TouchEvent | null, nextViewport: Viewport) => {
      onViewportChange?.(nextViewport)
      // Auto-pan during a node drag fires onMoveEnd every frame. Committing
      // those as document revisions remaps nodes mid-gesture and fights the
      // pointer. Defer until drag stop.
      if (dragBaseline.current.size > 0) return
      onCommand?.({ type: 'viewport.set', viewport: nextViewport })
    },
    [onCommand, onViewportChange],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      onCommand?.({
        type: 'edge.connect',
        source: {
          nodeId: connection.source,
          portId: portIdFromHandle(connection.sourceHandle),
        },
        target: {
          nodeId: connection.target,
          portId: portIdFromHandle(connection.targetHandle),
        },
      })
    },
    [onCommand],
  )

  /**
   * Deletion is the document owner's call, so the gesture is refused unless
   * somebody is listening for it.
   *
   * Without this, Backspace removed elements from the local flow state only:
   * no command was emitted, the document never changed, and the next document
   * update resurrected everything the user thought they had deleted.
   */
  const handleBeforeDelete = useCallback(
    async () => Boolean(onCommand) && !readonly,
    [onCommand, readonly],
  )

  const handleDelete = useCallback(
    ({ nodes: deletedNodes, edges: deletedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      const entities: GraphEntityReference[] = [
        ...deletedNodes.map((node) => ({ kind: 'node' as const, id: node.id })),
        ...deletedEdges.map((edge) => ({ kind: 'edge' as const, id: edge.id })),
      ]
      if (entities.length === 0) return
      onCommand?.({ type: 'entity.delete', entities })
    },
    [onCommand],
  )

  const handlePaneClick = useCallback(
    () => {
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
        /*
         * Always wired, including read-only. `nodes` is controlled, so xyflow
         * applies nothing itself — it only reports. Dropping the handler in
         * read-only mode dropped the `select` changes with the rest, so nodes
         * could not be selected at all and `onSelectionChange` never fired,
         * while edges (whose handler was wired unconditionally) still could.
         * Movement is prevented by `nodesDraggable`, at the source.
         */
        onNodesChange={onNodesChange}
        onNodeDragStart={readonly ? undefined : handleNodeDragStart}
        onNodeDragStop={readonly ? undefined : handleNodeDragStop}
        onEdgesChange={onEdgesChange}
        onSelectionChange={handleSelectionChange}
        onConnect={readonly ? undefined : handleConnect}
        onBeforeDelete={handleBeforeDelete}
        onDelete={readonly ? undefined : handleDelete}
        onMoveEnd={handleMoveEnd}
        onPaneClick={handlePaneClick}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable
        /*
         * Stated rather than left to the defaults, because the canvas is marked
         * `role="application"` — which tells assistive tech to stop intercepting
         * keys and hand them to us. That is only honest if there is in fact a
         * keyboard model: Tab reaches nodes and edges, arrows move a focused
         * node, Enter selects. Turning either of these off would make the role a
         * lie and strand keyboard users on a canvas they cannot enter.
         */
        nodesFocusable
        edgesFocusable
        disableKeyboardA11y={false}
        fitView={false}
        minZoom={0.25}
        maxZoom={2}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={readonly ? null : ['Backspace', 'Delete']}
        onInit={() => {
          if (!documentRef.current.viewport) {
            void fitView({ padding: 0.2 })
          }
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
