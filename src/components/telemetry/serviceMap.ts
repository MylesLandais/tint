import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphPort,
  NodeRuntimeSummary,
} from '../graph/contracts'
import { durationOf } from './layout'
import type { TelemetryTrace } from './types'

const OUT_PORT: GraphPort = {
  id: 'out:output',
  key: 'out',
  direction: 'output',
  cardinality: 'multiple',
}

const IN_PORT: GraphPort = {
  id: 'in:input',
  key: 'in',
  direction: 'input',
  cardinality: 'multiple',
}

const READONLY = {
  movable: false,
  connectable: false,
  deletable: false,
  editable: false,
  resizable: false,
} as const

type ServiceStats = {
  service: string
  spanCount: number
  errorCount: number
  durationMs: number
}

function statsByService(trace: TelemetryTrace): Map<string, ServiceStats> {
  const stats = new Map<string, ServiceStats>()
  for (const span of trace.spans) {
    const current = stats.get(span.service)
    if (current) {
      current.spanCount += 1
      if (span.status === 'error') current.errorCount += 1
      current.durationMs += durationOf(span)
    } else {
      stats.set(span.service, {
        service: span.service,
        spanCount: 1,
        errorCount: span.status === 'error' ? 1 : 0,
        durationMs: durationOf(span),
      })
    }
  }
  return stats
}

/**
 * Parent→child span links become a ClickHouse-style service topology: one node
 * per `service`, one edge per distinct service pair.
 */
export function graphDocumentFromTrace(trace: TelemetryTrace): GraphDocument {
  const stats = statsByService(trace)
  const byId = new Map(trace.spans.map((span) => [span.spanId, span]))
  const edgeCount = new Map<string, { source: string; target: string; count: number }>()

  for (const span of trace.spans) {
    if (!span.parentSpanId) continue
    const parent = byId.get(span.parentSpanId)
    if (!parent || parent.service === span.service) continue
    const key = `${parent.service}\0${span.service}`
    const existing = edgeCount.get(key)
    if (existing) existing.count += 1
    else edgeCount.set(key, { source: parent.service, target: span.service, count: 1 })
  }

  const incoming = new Set([...edgeCount.values()].map((edge) => edge.target))
  const layers = new Map<string, number>()
  const queue = [...stats.keys()].filter((service) => !incoming.has(service))
  if (queue.length === 0 && stats.size > 0) queue.push([...stats.keys()][0]!)
  for (const root of queue) layers.set(root, 0)

  let progressed = true
  while (progressed) {
    progressed = false
    for (const edge of edgeCount.values()) {
      const sourceLayer = layers.get(edge.source)
      if (sourceLayer == null) continue
      const next = sourceLayer + 1
      const current = layers.get(edge.target)
      if (current == null || next > current) {
        layers.set(edge.target, next)
        progressed = true
      }
    }
  }

  const byLayer = new Map<number, string[]>()
  for (const service of stats.keys()) {
    const layer = layers.get(service) ?? 0
    const row = byLayer.get(layer)
    if (row) row.push(service)
    else byLayer.set(layer, [service])
  }
  for (const row of byLayer.values()) row.sort()

  const nodes: GraphNode[] = []
  for (const [layer, services] of [...byLayer.entries()].sort(([left], [right]) => left - right)) {
    services.forEach((service, index) => {
      const summary = stats.get(service)!
      const isRoot = layer === 0
      nodes.push({
        id: service,
        kind: isRoot ? 'trigger' : 'action',
        position: { x: layer * 280, y: index * 160 },
        presentation: {
          label: service,
          description: `${summary.spanCount} span${summary.spanCount === 1 ? '' : 's'}`,
        },
        configuration: {
          service,
          spanCount: summary.spanCount,
          errorCount: summary.errorCount,
        },
        ports: isRoot ? [OUT_PORT] : [IN_PORT, OUT_PORT],
        capabilities: READONLY,
      })
    })
  }

  const edges: GraphEdge[] = [...edgeCount.values()].map((edge) => ({
    id: `${edge.source}->${edge.target}`,
    source: { nodeId: edge.source, portId: 'out:output' },
    target: { nodeId: edge.target, portId: 'in:input' },
    kind: 'trace',
    metadata: { count: edge.count },
  }))

  return {
    schemaVersion: '0.1.0',
    id: `graph:trace:${trace.traceId}`,
    revision: 'r1',
    viewport: { x: 48, y: 32, zoom: 0.85 },
    metadata: {
      title: trace.name,
      source: 'telemetry',
      traceId: trace.traceId,
    },
    groups: [],
    nodes,
    edges,
  }
}

export function runtimeByService(
  trace: TelemetryTrace,
): ReadonlyMap<string, NodeRuntimeSummary> {
  const stats = statsByService(trace)
  return new Map(
    [...stats.values()].map((summary) => [
      summary.service,
      {
        status: summary.errorCount > 0 ? 'failed' : 'succeeded',
        detail: `${summary.spanCount} spans`,
      } satisfies NodeRuntimeSummary,
    ]),
  )
}
