import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphPort,
} from '../graph/document'
import { durationOf } from './layout'
import type { TelemetryTrace } from './types'

export type NodeRuntimeSummary = {
  status: 'idle' | 'running' | 'succeeded' | 'failed'
  detail?: string
}

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

/** Collapse cycles before assigning longest-path layers to the service DAG. */
function serviceLayers(
  services: Iterable<string>,
  edges: Iterable<{ source: string; target: string }>,
): Map<string, number> {
  const ordered = [...services].sort()
  const outgoing = new Map(ordered.map((service) => [service, new Set<string>()]))
  for (const edge of edges) outgoing.get(edge.source)?.add(edge.target)

  const indices = new Map<string, number>()
  const lowLinks = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const components: string[][] = []
  let index = 0

  const visit = (service: string) => {
    indices.set(service, index)
    lowLinks.set(service, index)
    index += 1
    stack.push(service)
    onStack.add(service)
    for (const target of [...(outgoing.get(service) ?? [])].sort()) {
      if (!indices.has(target)) {
        visit(target)
        lowLinks.set(service, Math.min(lowLinks.get(service)!, lowLinks.get(target)!))
      } else if (onStack.has(target)) {
        lowLinks.set(service, Math.min(lowLinks.get(service)!, indices.get(target)!))
      }
    }
    if (lowLinks.get(service) !== indices.get(service)) return
    const component: string[] = []
    let member: string
    do {
      member = stack.pop()!
      onStack.delete(member)
      component.push(member)
    } while (member !== service)
    components.push(component.sort())
  }
  for (const service of ordered) if (!indices.has(service)) visit(service)

  const componentOf = new Map<string, number>()
  components.forEach((component, componentId) => {
    for (const service of component) componentOf.set(service, componentId)
  })
  const componentEdges = components.map(() => new Set<number>())
  const indegree = components.map(() => 0)
  for (const [source, targets] of outgoing) {
    const sourceId = componentOf.get(source)!
    for (const target of targets) {
      const targetId = componentOf.get(target)!
      if (sourceId === targetId || componentEdges[sourceId]!.has(targetId)) continue
      componentEdges[sourceId]!.add(targetId)
      indegree[targetId]! += 1
    }
  }
  const layers = components.map(() => 0)
  const ready = indegree.flatMap((count, componentId) => count === 0 ? [componentId] : [])
  while (ready.length > 0) {
    const componentId = ready.shift()!
    for (const targetId of componentEdges[componentId]!) {
      layers[targetId] = Math.max(layers[targetId]!, layers[componentId]! + 1)
      indegree[targetId]! -= 1
      if (indegree[targetId] === 0) ready.push(targetId)
    }
  }
  return new Map(ordered.map((service) => [service, layers[componentOf.get(service)!]!]))
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
  const layers = serviceLayers(stats.keys(), edgeCount.values())

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
      const isRoot = layer === 0 && !incoming.has(service)
      nodes.push({
        id: service,
        kind: isRoot ? 'trigger' : 'action',
        position: { x: 24 + layer * 260, y: 48 + index * 150 },
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
    viewport: { x: 16, y: 24, zoom: 0.72 },
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
