import { useMemo, useState } from 'react'
import {
  ForceGraphView,
  TimelineView,
  emptySelection,
  nodeStatusLabel,
  resolveNodeStatus,
  topologicalLanes,
  type GraphSelection,
  type GraphSpan,
  type NodeRuntimeSummary,
  type TimelineVariant,
} from '../../components/graph'
import { ontologyDocument, ontologySpans } from './fixtures/ontology'

/**
 * One document, four readings of it.
 *
 * Selection is held here, once, and passed to every view — which is the part of
 * the demo that actually proves something. If clicking a node in the network
 * highlights the same node in the schedule without either view knowing the other
 * exists, the document is doing the work.
 */
export function GraphProjectionsDemo() {
  const [variant, setVariant] = useState<TimelineVariant>('gantt')
  const [selection, setSelection] = useState<GraphSelection>(emptySelection)
  const [spans, setSpans] = useState<readonly GraphSpan[]>(ontologySpans)

  const runtimeByNodeId = useMemo(() => {
    // The runtime overlay is derived from the spans, not stored twice. A node's
    // last span wins, which is how a retry that succeeded should read.
    const byNode = new Map<string, NodeRuntimeSummary>()
    for (const span of [...spans].sort((a, b) => a.start - b.start)) {
      if (span.nodeId == null || span.status == null) continue
      if (span.status === 'ready' || span.status === 'warning' || span.status === 'error') continue
      byNode.set(span.nodeId, { status: span.status })
    }
    return byNode
  }, [spans])

  const dependency = useMemo(() => topologicalLanes(ontologyDocument), [])

  const selected = [...selection.nodeIds]
    .map((id) => ontologyDocument.nodes.find((node) => node.id === id))
    .filter((node) => node != null)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="inline-flex rounded-md border border-tint-border p-0.5">
          {(['gantt', 'trace', 'range'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={variant === option}
              onClick={() => setVariant(option)}
              className={
                variant === option
                  ? 'rounded px-3 py-1 bg-tint-accent text-tint-on-accent'
                  : 'rounded px-3 py-1 text-tint-muted'
              }
            >
              {option}
            </button>
          ))}
        </div>
        <span className="text-tint-muted">
          {dependency.acyclic
            ? `${dependency.order.length} nodes, ${Math.max(...dependency.depthByNodeId.values()) + 1} depth levels`
            : `does not sort: ${dependency.cycleNodeIds.join(', ')}`}
        </span>
        <span className="ml-auto text-tint-muted">
          {selected.length === 0
            ? 'Nothing selected'
            : selected
                .map((node) => node.presentation?.label ?? node.kind)
                .join(', ')}
        </span>
      </div>

      <ForceGraphView
        document={ontologyDocument}
        selection={selection}
        runtimeByNodeId={runtimeByNodeId}
        onSelectionChange={setSelection}
        height={360}
      />

      <TimelineView
        document={ontologyDocument}
        spans={spans}
        variant={variant}
        selection={selection}
        onSelectionChange={setSelection}
        onSpanChange={(spanId, next) =>
          setSpans((current) =>
            current.map((span) => (span.id === spanId ? { ...span, ...next } : span)),
          )
        }
      />

      <ol className="grid gap-1 text-sm">
        {[...dependency.depthByNodeId.entries()]
          .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
          .map(([nodeId, depth]) => {
            const node = ontologyDocument.nodes.find((candidate) => candidate.id === nodeId)
            const status = resolveNodeStatus([], runtimeByNodeId.get(nodeId))
            return (
              <li key={nodeId} className="flex items-baseline gap-2 text-tint-muted">
                <span className="w-8 tabular-nums">{depth}</span>
                <span className="text-tint-ink">
                  {node?.presentation?.label ?? nodeId}
                </span>
                <span className="text-xs">{node?.kind}</span>
                <span className="ml-auto text-xs">{nodeStatusLabel(status)}</span>
              </li>
            )
          })}
      </ol>
    </div>
  )
}
