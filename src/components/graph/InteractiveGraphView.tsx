import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Icon } from '../icon'
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
import { applyCommand, emptySelection } from './contracts'
import { createDefaultNodeRegistry } from './nodes/defaultRegistry'
import { useFullscreen } from '../../lib/useFullscreen'
import { cn } from '../../lib/utils'

/** One frame past the fullscreen transition, so the container has its final size. */
const REMEASURE_DELAY_MS = 50

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
  const keyboardHelpId = useId()
  const resolvedRegistry = useMemo(
    () => registry ?? createDefaultNodeRegistry(),
    [registry],
  )
  /**
   * Controlled-ness is latched on the first render, not re-derived per render.
   *
   * `controlledSelection ?? uncontrolledSelection` let a component boot
   * uncontrolled, become controlled on the host's first `setSelection`, and then
   * fall back to the *stale* internal value the moment the host passed
   * `undefined` again — resurrecting the first selection ever made, often from a
   * document that no longer existed.
   */
  const isControlled = useRef(controlledSelection != null).current
  const [uncontrolledSelection, setUncontrolledSelection] =
    useState<GraphSelection>(emptySelection)

  if (import.meta.env.DEV && isControlled !== (controlledSelection != null)) {
    console.error(
      'InteractiveGraphView: `selection` switched between controlled and uncontrolled. ' +
        'Pass a selection for the component\'s whole lifetime, or never — use ' +
        '`emptySelection()` rather than `undefined` to clear it.',
    )
  }

  const selection = isControlled
    ? (controlledSelection ?? emptySelection())
    : uncontrolledSelection

  /**
   * React Flow measures its container on resize, and a fullscreen transition
   * changes the size without one — the canvas keeps the old viewport until
   * something else nudges it.
   *
   * The timer is held so it can be cancelled: this used to be four bare
   * `setTimeout` calls scattered through the fullscreen handlers, none of them
   * cleared, firing into an unmounted tree.
   */
  const remeasureTimer = useRef<number | undefined>(undefined)
  const remeasureCanvas = useCallback(() => {
    window.clearTimeout(remeasureTimer.current)
    remeasureTimer.current = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, REMEASURE_DELAY_MS)
  }, [])
  useEffect(() => () => window.clearTimeout(remeasureTimer.current), [])

  const {
    isFullscreen,
    theaterMode,
    toggle: toggleFullscreen,
  } = useFullscreen(rootRef, { onChange: remeasureCanvas })

  const handleSelectionChange = useCallback(
    (next: GraphSelection) => {
      if (!isControlled) setUncontrolledSelection(next)
      onSelectionChange?.(next)
    },
    [isControlled, onSelectionChange],
  )

  /**
   * Every mutating command takes the same route: report it, then offer the
   * document it produces. `node.configure` and `node.move` used to be applied
   * inline here while the other six were only reported, so a host wiring
   * `onCommand` into its own store double-applied those two and dropped the rest.
   */
  const handleCommand = useCallback(
    (command: GraphCommand) => {
      onCommand?.(command)
      if (!onDocumentChange) return
      const next = applyCommand(document, command, resolvedRegistry)
      if (next !== document) onDocumentChange(next)
    },
    [document, onCommand, onDocumentChange, resolvedRegistry],
  )

  const handlePositionsCommit = useCallback(
    (positions: Record<string, Point>) => {
      if (!onDocumentChange) return
      onDocumentChange(
        applyCommand(
          document,
          { type: 'node.move', nodeIds: Object.keys(positions), positions },
          resolvedRegistry,
        ),
      )
    },
    [document, onDocumentChange, resolvedRegistry],
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
      // Theater mode covers the page, so it is announced as one. The hook moves
      // focus in, cycles Tab inside it, and restores focus on the way out.
      role={theaterMode ? 'dialog' : undefined}
      aria-modal={theaterMode ? true : undefined}
      aria-label={theaterMode ? 'Graph, fullscreen' : undefined}
      tabIndex={theaterMode ? -1 : undefined}
      className={cn(
        'tint-graph-view',
        theaterMode && 'tint-graph-view--theater',
        className,
      )}
    >
      <div
        className="tint-graph-view__canvas"
        role="application"
        aria-label="Graph canvas"
        aria-describedby={keyboardHelpId}
      >
        <p id={keyboardHelpId} className="tint-graph-view__sr-only">
          Press Tab to move between nodes and edges, arrow keys to move a focused
          node, and Enter to select. Press Escape to leave fullscreen.
        </p>
        {showFullscreenControl ? (
          <div className="tint-graph-view__toolbar">
            <button
              type="button"
              className="tint-graph-view__fullscreen"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              <Icon icon={isFullscreen ? Minimize2 : Maximize2} size="sm" />
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
                        {/* Two issues can share a code — one per offending
                            path — so the code alone is not a key. */}
                        {issues.map((issue, index) => (
                          <li
                            key={`${issue.code}:${issue.path ?? index}`}
                            data-severity={issue.severity}
                          >
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
