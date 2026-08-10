import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { XyflowCanvas } from './adapter/XyflowCanvas'
import type {
  GraphCommand,
  GraphDocument,
  GraphSelection,
  GraphViewport,
  NodeRegistry,
  NodeRuntimeSummary,
  Point,
  ValidationIssue,
} from './contracts'
import { emptySelection } from './contracts'
import { createDefaultNodeRegistry } from './nodes/defaultRegistry'
import {
  FULLSCREEN_EVENTS,
  exitElementFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
} from '../../lib/fullscreen'
import { cn } from '../../lib/utils'
import './graph.css'

export type InteractiveGraphViewProps = {
  document: GraphDocument
  registry?: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  /** Per-node validation issues (ERROR / WARN chrome on nodes + inspector). */
  validationByNodeId?: ReadonlyMap<string, readonly ValidationIssue[]>
  /** Optional read-only execution summary chrome (idle/running/succeeded/failed). */
  runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
  /** Optional host-driven camera (e.g. follow a mock execution). */
  viewport?: GraphViewport
  className?: string
  /** When true, renders a side inspector listing the current selection. */
  showInspector?: boolean
  /** Show the canvas fullscreen control. Defaults to true. */
  showFullscreenControl?: boolean
  onDocumentChange?: (document: GraphDocument) => void
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onCommand?: (command: GraphCommand) => void
}

/**
 * Public graph canvas seam. Hosts pass a canonical `GraphDocument`; xyflow stays
 * behind the adapter. This component does not execute scripts or issue SQL/PGQ.
 */
export function InteractiveGraphView({
  document,
  registry,
  readonly = false,
  selection: controlledSelection,
  validationByNodeId,
  runtimeByNodeId,
  viewport,
  className,
  showInspector = true,
  showFullscreenControl = true,
  onDocumentChange,
  onSelectionChange,
  onViewportChange,
  onCommand,
}: InteractiveGraphViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const resolvedRegistry = useMemo(
    () => registry ?? createDefaultNodeRegistry(),
    [registry],
  )
  const [uncontrolledSelection, setUncontrolledSelection] =
    useState<GraphSelection>(emptySelection)
  const selection = controlledSelection ?? uncontrolledSelection
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = getFullscreenElement() === rootRef.current
      setIsFullscreen(active || theaterMode)
      if (active) setTheaterMode(false)
      // React Flow measures on resize; nudge after the browser settles.
      window.setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 50)
    }
    for (const eventName of FULLSCREEN_EVENTS) {
      globalThis.document.addEventListener(eventName, onFullscreenChange)
    }
    return () => {
      for (const eventName of FULLSCREEN_EVENTS) {
        globalThis.document.removeEventListener(eventName, onFullscreenChange)
      }
    }
  }, [theaterMode])

  useEffect(() => {
    if (!theaterMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTheaterMode(false)
        setIsFullscreen(false)
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
      }
    }
    const previousOverflow = globalThis.document.body.style.overflow
    globalThis.document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
    return () => {
      globalThis.document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [theaterMode])

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current
    if (!root) return

    const apiActive = getFullscreenElement() === root
    if (apiActive || theaterMode) {
      if (apiActive) void exitElementFullscreen().catch(() => undefined)
      setTheaterMode(false)
      setIsFullscreen(false)
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
      return
    }

    void requestElementFullscreen(root).catch(() => {
      setTheaterMode(true)
      setIsFullscreen(true)
    })
  }, [theaterMode])

  const handleSelectionChange = useCallback(
    (next: GraphSelection) => {
      if (controlledSelection == null) {
        setUncontrolledSelection(next)
      }
      onSelectionChange?.(next)
    },
    [controlledSelection, onSelectionChange],
  )

  const handlePositionsCommit = useCallback(
    (positions: Record<string, Point>) => {
      if (!onDocumentChange) return
      onDocumentChange({
        ...document,
        revision: nextRevision(document.revision),
        nodes: document.nodes.map((node) =>
          positions[node.id]
            ? { ...node, position: positions[node.id]! }
            : node,
        ),
      })
    },
    [document, onDocumentChange],
  )

  const handleCommand = useCallback(
    (command: GraphCommand) => {
      if (command.type === 'node.configure' && onDocumentChange) {
        onDocumentChange({
          ...document,
          revision: nextRevision(document.revision),
          nodes: document.nodes.map((node) =>
            node.id === command.nodeId
              ? { ...node, configuration: command.configuration }
              : node,
          ),
        })
      }
      onCommand?.(command)
    },
    [document, onCommand, onDocumentChange],
  )

  const selectedNodes = document.nodes.filter((node) =>
    selection.nodeIds.has(node.id),
  )
  const selectedEdges = document.edges.filter((edge) =>
    selection.edgeIds.has(edge.id),
  )

  return (
    <div
      ref={rootRef}
      data-tint-graph-view
      data-readonly={readonly ? 'true' : 'false'}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      data-theater={theaterMode ? 'true' : 'false'}
      className={cn(
        'tint-graph-view',
        theaterMode && 'tint-graph-view--theater',
        className,
      )}
    >
      <div className="tint-graph-view__canvas" role="application" aria-label="Graph canvas">
        {showFullscreenControl ? (
          <div className="tint-graph-view__toolbar">
            <button
              type="button"
              className="tint-graph-view__fullscreen"
              data-testid="graph-fullscreen"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 size={16} aria-hidden="true" />
              ) : (
                <Maximize2 size={16} aria-hidden="true" />
              )}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        ) : null}
        <XyflowCanvas
          document={document}
          registry={resolvedRegistry}
          readonly={readonly}
          selection={selection}
          validationByNodeId={validationByNodeId}
          runtimeByNodeId={runtimeByNodeId}
          viewport={viewport}
          onSelectionChange={handleSelectionChange}
          onViewportChange={onViewportChange}
          onNodePositionsCommit={handlePositionsCommit}
          onCommand={handleCommand}
        />
      </div>

      {showInspector ? (
        <aside className="tint-graph-view__inspector" aria-label="Graph inspector">
          <header className="tint-graph-view__inspector-header">
            <h2>Inspector</h2>
            <p>
              {selectedNodes.length + selectedEdges.length === 0
                ? 'Nothing selected'
                : `${selectedNodes.length} node(s), ${selectedEdges.length} edge(s)`}
            </p>
          </header>

          {selectedNodes.length === 0 && selectedEdges.length === 0 ? (
            <p className="tint-graph-view__inspector-empty">
              Click a node or edge. Drag the canvas to pan, scroll to zoom, and drag
              nodes to reposition{readonly ? ' (read-only: moves are disabled)' : ''}.
            </p>
          ) : null}

          {selectedNodes.map((node) => {
            const issues = validationByNodeId?.get(node.id) ?? []
            const runtime = runtimeByNodeId?.get(node.id)
            return (
            <section key={node.id} className="tint-graph-view__inspector-card">
              <h3>{node.presentation?.label ?? node.kind}</h3>
              <dl>
                <div>
                  <dt>Id</dt>
                  <dd>
                    <code>{node.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>Kind</dt>
                  <dd>{node.kind}</dd>
                </div>
                {runtime ? (
                  <div>
                    <dt>Runtime</dt>
                    <dd>
                      {runtime.status}
                      {runtime.detail ? ` — ${runtime.detail}` : ''}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Position</dt>
                  <dd>
                    {Math.round(node.position.x)}, {Math.round(node.position.y)}
                  </dd>
                </div>
                <div>
                  <dt>Ports</dt>
                  <dd>{node.ports.map((port) => port.key).join(', ') || 'none'}</dd>
                </div>
                {issues.length ? (
                  <div>
                    <dt>Issues</dt>
                    <dd>
                      <ul className="tint-graph-view__inspector-issues">
                        {issues.map((issue) => (
                          <li key={issue.code} data-severity={issue.severity}>
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Configuration</dt>
                  <dd>
                    <pre>{JSON.stringify(node.configuration, null, 2)}</pre>
                  </dd>
                </div>
              </dl>
            </section>
            )
          })}

          {selectedEdges.map((edge) => (
            <section key={edge.id} className="tint-graph-view__inspector-card">
              <h3>Edge</h3>
              <dl>
                <div>
                  <dt>Id</dt>
                  <dd>
                    <code>{edge.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>From</dt>
                  <dd>
                    <code>
                      {edge.source.nodeId}.{edge.source.portId}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt>To</dt>
                  <dd>
                    <code>
                      {edge.target.nodeId}.{edge.target.portId}
                    </code>
                  </dd>
                </div>
              </dl>
            </section>
          ))}
        </aside>
      ) : null}
    </div>
  )
}

function nextRevision(revision: string): string {
  const match = /^r(\d+)$/.exec(revision)
  if (!match) return `r${Date.now()}`
  return `r${Number(match[1]) + 1}`
}
