import { describe, expect, it } from 'vitest'
import { graphDocumentFromTrace, runtimeByService } from './serviceMap'
import type { TelemetrySpan, TelemetryTrace } from './types'

function span(
  partial: Pick<TelemetrySpan, 'spanId' | 'name' | 'service' | 'startMs' | 'endMs'> &
    Partial<TelemetrySpan>,
): TelemetrySpan {
  return {
    traceId: 'trc-map',
    kind: 'internal',
    status: 'ok',
    ...partial,
  }
}

const trace: TelemetryTrace = {
  traceId: 'trc-map',
  name: 'group',
  spans: [
    span({ spanId: 'conv', name: 'conversation', service: 'tint.chat', startMs: 0, endMs: 80 }),
    span({
      spanId: 'maya',
      parentSpanId: 'conv',
      name: 'agent.maya',
      service: 'agent.maya',
      startMs: 10,
      endMs: 40,
    }),
    span({
      spanId: 'llm',
      parentSpanId: 'maya',
      name: 'llm.generate',
      service: 'mock.llm',
      startMs: 10,
      endMs: 30,
    }),
    span({
      spanId: 'jordan',
      parentSpanId: 'conv',
      name: 'agent.jordan',
      service: 'agent.jordan',
      startMs: 45,
      endMs: 80,
      status: 'error',
    }),
    span({
      spanId: 'jordan-llm',
      parentSpanId: 'jordan',
      name: 'llm.generate',
      service: 'mock.llm',
      startMs: 45,
      endMs: 70,
    }),
  ],
}

describe('graphDocumentFromTrace', () => {
  it('collapses spans into a service topology with one edge per pair', () => {
    const document = graphDocumentFromTrace(trace)

    expect(document.nodes.map((node) => node.id).sort()).toEqual([
      'agent.jordan',
      'agent.maya',
      'mock.llm',
      'tint.chat',
    ])
    expect(document.nodes.find((node) => node.id === 'tint.chat')?.kind).toBe('trigger')
    expect(document.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tint.chat->agent.maya' }),
        expect.objectContaining({ id: 'tint.chat->agent.jordan' }),
        expect.objectContaining({
          id: 'agent.maya->mock.llm',
          metadata: { count: 1 },
        }),
        expect.objectContaining({
          id: 'agent.jordan->mock.llm',
          metadata: { count: 1 },
        }),
      ]),
    )
    expect(runtimeByService(trace).get('agent.jordan')?.status).toBe('failed')
    expect(runtimeByService(trace).get('agent.maya')?.status).toBe('succeeded')
  })
})
