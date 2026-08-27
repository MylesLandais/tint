import type { GraphDocument } from '../contracts'
import type { NodeStatus } from '../nodes/nodeStatus'
import { topologicalLanes } from './dependency'

/**
 * A span: when something happened, and what it happened to.
 *
 * Time is an *overlay*, not a document field. `GraphDocument` describes
 * structure; a run describes time; and the same structure has as many runs as
 * you care to keep. This follows `InteractiveGraphView`'s existing
 * `runtimeByNodeId` prop, which already treats execution state as something
 * keyed alongside the document rather than embedded in it — and it is the
 * reason a Gantt of a schedule and a trace of a run can be the same projection
 * over the same nodes.
 *
 * Spans carry their own identity because a node can be entered more than once
 * (a retry, a loop body, a tool called twice), and because `parentSpanId` is
 * span-to-span, not node-to-node.
 */
export type GraphSpan = {
  id: string
  /** The node this span is an execution of, when there is one. */
  nodeId?: string
  label?: string
  /** Milliseconds, in whatever epoch the host is using. Only differences matter. */
  start: number
  end: number
  status?: NodeStatus
  parentSpanId?: string
}

export type TimelineInterval = {
  id: string
  nodeId?: string
  label: string
  start: number
  end: number
  status?: NodeStatus
  /** Nesting level within its track. Non-zero only for the trace variant. */
  depth: number
}

export type TimelineTrack = {
  id: string
  label: string
  lane: number
  intervals: readonly TimelineInterval[]
}

export type TimelineProjection = {
  tracks: readonly TimelineTrack[]
  /** The domain, in the spans' units. Equal bounds mean nothing to draw. */
  start: number
  end: number
}

/**
 * How the same spans get laid out.
 *
 * - `gantt` — one track per node, in dependency order. Nodes with no span keep
 *   their empty track: a schedule where a task never ran should show a hole, not
 *   silently shorten.
 * - `trace` — one track per span, ordered by start, indented by parent depth.
 * - `range` — every span on one track, which is the editable variant.
 */
export type TimelineVariant = 'gantt' | 'trace' | 'range'

export type TimelineOptions = {
  variant?: TimelineVariant
}

export function projectTimeline(
  document: GraphDocument,
  spans: readonly GraphSpan[],
  options: TimelineOptions = {},
): TimelineProjection {
  const variant = options.variant ?? 'gantt'
  const bounds = spanBounds(spans)
  const labels = labelsByNodeId(document)

  const tracks =
    variant === 'gantt'
      ? ganttTracks(document, spans, labels)
      : variant === 'trace'
        ? traceTracks(spans, labels)
        : rangeTrack(spans, labels)

  return { tracks, ...bounds }
}

function spanBounds(spans: readonly GraphSpan[]): { start: number; end: number } {
  if (spans.length === 0) return { start: 0, end: 0 }
  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const span of spans) {
    // A span whose end precedes its start is real data, not a bug to throw on —
    // clocks go backwards. The domain covers both ends either way.
    start = Math.min(start, span.start, span.end)
    end = Math.max(end, span.start, span.end)
  }
  return { start, end }
}

function labelsByNodeId(document: GraphDocument): ReadonlyMap<string, string> {
  return new Map(
    document.nodes.map((node) => [node.id, node.presentation?.label ?? node.kind]),
  )
}

function intervalLabel(span: GraphSpan, labels: ReadonlyMap<string, string>): string {
  return span.label ?? (span.nodeId != null ? labels.get(span.nodeId) : undefined) ?? span.id
}

function toInterval(
  span: GraphSpan,
  labels: ReadonlyMap<string, string>,
  depth = 0,
): TimelineInterval {
  return {
    id: span.id,
    nodeId: span.nodeId,
    label: intervalLabel(span, labels),
    start: Math.min(span.start, span.end),
    end: Math.max(span.start, span.end),
    status: span.status,
    depth,
  }
}

function byStart(a: TimelineInterval, b: TimelineInterval): number {
  return a.start - b.start || a.id.localeCompare(b.id)
}

function ganttTracks(
  document: GraphDocument,
  spans: readonly GraphSpan[],
  labels: ReadonlyMap<string, string>,
): readonly TimelineTrack[] {
  const { order, depthByNodeId } = topologicalLanes(document)
  // A cyclic graph does not sort, but it still has nodes worth drawing; fall
  // back to document order rather than rendering nothing.
  const nodeOrder = order.length > 0 ? order : document.nodes.map((node) => node.id)
  const rank = new Map(nodeOrder.map((id, index) => [id, index]))

  const byNode = new Map<string, TimelineInterval[]>()
  const orphans: TimelineInterval[] = []
  for (const span of spans) {
    const interval = toInterval(span, labels)
    if (span.nodeId != null && rank.has(span.nodeId)) {
      const bucket = byNode.get(span.nodeId)
      if (bucket) bucket.push(interval)
      else byNode.set(span.nodeId, [interval])
    } else {
      orphans.push(interval)
    }
  }

  const tracks = nodeOrder
    .slice()
    .sort(
      (a, b) =>
        (depthByNodeId.get(a) ?? 0) - (depthByNodeId.get(b) ?? 0) ||
        (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
    )
    .map((nodeId, lane) => ({
      id: nodeId,
      label: labels.get(nodeId) ?? nodeId,
      lane,
      intervals: (byNode.get(nodeId) ?? []).sort(byStart),
    }))

  // Spans for nodes the document does not contain are the loudest signal an
  // adapter can produce that the ontology and the runtime disagree. Show them.
  if (orphans.length > 0) {
    tracks.push({
      id: '__unmatched__',
      label: 'Unmatched spans',
      lane: tracks.length,
      intervals: orphans.sort(byStart),
    })
  }

  return tracks
}

function traceTracks(
  spans: readonly GraphSpan[],
  labels: ReadonlyMap<string, string>,
): readonly TimelineTrack[] {
  const byId = new Map(spans.map((span) => [span.id, span]))

  function depthOf(span: GraphSpan): number {
    let depth = 0
    let current = span
    // A parent chain can be circular in malformed data; the visited set bounds
    // the walk rather than hanging the render.
    const visited = new Set<string>([span.id])
    while (current.parentSpanId != null) {
      const parent = byId.get(current.parentSpanId)
      if (parent == null || visited.has(parent.id)) break
      visited.add(parent.id)
      current = parent
      depth += 1
    }
    return depth
  }

  return spans
    .map((span) => toInterval(span, labels, depthOf(span)))
    .sort((a, b) => a.start - b.start || a.depth - b.depth || a.id.localeCompare(b.id))
    .map((interval, lane) => ({
      id: interval.id,
      label: interval.label,
      lane,
      intervals: [interval],
    }))
}

function rangeTrack(
  spans: readonly GraphSpan[],
  labels: ReadonlyMap<string, string>,
): readonly TimelineTrack[] {
  return [
    {
      id: '__range__',
      label: 'Range',
      lane: 0,
      intervals: spans.map((span) => toInterval(span, labels)).sort(byStart),
    },
  ]
}
