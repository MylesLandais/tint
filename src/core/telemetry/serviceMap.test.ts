import { describe, expect, it } from 'vitest'
import { graphDocumentFromTrace } from './serviceMap'
import type { TelemetrySpan, TelemetryTrace } from './types'

function span(spanId: string, service: string, parentSpanId?: string): TelemetrySpan {
  return { traceId: 'cycle', spanId, parentSpanId, service, name: spanId,
    kind: 'internal', status: 'ok', startMs: 0, endMs: 10 }
}

describe('service topology layering', () => {
  it('terminates for service cycles and preserves every edge with valid ports', () => {
    const trace: TelemetryTrace = { traceId: 'cycle', name: 'cycle', spans: [
      span('a1', 'A'), span('b1', 'B', 'a1'), span('a2', 'A', 'b1'),
      span('c1', 'C', 'a2'),
    ] }
    const document = graphDocumentFromTrace(trace)
    expect(document.edges.map((edge) => edge.id)).toEqual(['A->B', 'B->A', 'A->C'])
    expect(document.nodes).toHaveLength(3)
    expect(document.nodes.find((node) => node.id === 'A')?.position.x)
      .toBe(document.nodes.find((node) => node.id === 'B')?.position.x)
    expect(document.nodes.find((node) => node.id === 'C')?.position.x)
      .toBeGreaterThan(document.nodes.find((node) => node.id === 'A')!.position.x)
    for (const edge of document.edges) {
      const target = document.nodes.find((node) => node.id === edge.target.nodeId)!
      expect(target.ports.some((port) => port.id === edge.target.portId)).toBe(true)
    }
  })
})
