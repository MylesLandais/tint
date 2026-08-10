import { useCallback, useMemo, useState } from 'react'
import { XyflowCanvas } from './adapter/XyflowCanvas'
import type {
  GraphCommand,
  GraphDocument,
  GraphSelection,
  GraphViewport,
  NodeRegistry,
  Point,
} from './contracts'
import { emptySelection } from './contracts'
import { createDefaultNodeRegistry } from './nodes/defaultRegistry'
import { cn } from '../../lib/utils'
import './graph.css'

export type InteractiveGraphViewProps = {
  document: GraphDocument
  registry?: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  className?: string
  /** When true, renders a side inspector listing the current selection. */
  showInspector?: boolean
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
  className,
  showInspector = true,
  onDocumentChange,
  onSelectionChange,
  onViewportChange,
  onCommand,
}: InteractiveGraphViewProps) {
  const resolvedRegistry = useMemo(
    () => registry ?? createDefaultNodeRegistry(),
    [registry],
  )
  const [uncontrolledSelection, setUncontrolledSelection] =
    useState<GraphSelection>(emptySelection)
  const selection = controlledSelection ?? uncontrolledSelection

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
      onCommand?.(command)
    },
    [onCommand],
  )

  const selectedNodes = document.nodes.filter((node) =>
    selection.nodeIds.has(node.id),
  )
  const selectedEdges = document.edges.filter((edge) =>
    selection.edgeIds.has(edge.id),
  )

  return (
    <div
      data-tint-graph-view
      data-readonly={readonly ? 'true' : 'false'}
      className={cn('tint-graph-view', className)}
    >
      <div className="tint-graph-view__canvas" role="application" aria-label="Graph canvas">
        <XyflowCanvas
          document={document}
          registry={resolvedRegistry}
          readonly={readonly}
          selection={selection}
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

          {selectedNodes.map((node) => (
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
                <div>
                  <dt>Configuration</dt>
                  <dd>
                    <pre>{JSON.stringify(node.configuration, null, 2)}</pre>
                  </dd>
                </div>
              </dl>
            </section>
          ))}

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
