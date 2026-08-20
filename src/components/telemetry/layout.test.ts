import { describe, expect, it } from 'vitest'
import { layoutTrace, serviceColor } from './layout'
import type { TelemetrySpan, TelemetryTrace } from './types'

function span(
  partial: Pick<TelemetrySpan, 'spanId' | 'name' | 'service' | 'startMs' | 'endMs'> &
    Partial<TelemetrySpan>,
): TelemetrySpan {
  return {
    traceId: 'trc-test',
    kind: 'internal',
    status: 'ok',
    ...partial,
  }
}

const trace: TelemetryTrace = {
  traceId: 'trc-test',
  name: 'group',
  spans: [
    span({ spanId: 'root', name: 'conversation', service: 'tint.chat', startMs: 0, endMs: 100 }),
    span({
      spanId: 'maya',
      parentSpanId: 'root',
      name: 'agent.maya',
      service: 'agent.maya',
      startMs: 10,
      endMs: 60,
    }),
    span({
      spanId: 'llm',
      parentSpanId: 'maya',
      name: 'llm.generate',
      service: 'mock.llm',
      startMs: 10,
      endMs: 40,
    }),
    span({
      spanId: 'jordan',
      parentSpanId: 'root',
      name: 'agent.jordan',
      service: 'agent.jordan',
      startMs: 70,
      endMs: 100,
    }),
  ],
}

describe('layoutTrace', () => {
  it('walks children by start time and indents by parent depth', () => {
    const layout = layoutTrace(trace)

    expect(layout.durationMs).toBe(100)
    expect(layout.spans.map((entry) => [entry.spanId, entry.depth])).toEqual([
      ['root', 0],
      ['maya', 1],
      ['llm', 2],
      ['jordan', 1],
    ])
    expect(layout.spans[2]?.widthRatio).toBe(0.3)
    expect(layout.spans[3]?.offsetRatio).toBe(0.7)
  })

  it('keeps a stable colour per service', () => {
    expect(serviceColor('agent.maya')).toBe(serviceColor('agent.maya'))
    expect(serviceColor('agent.maya')).not.toBe(serviceColor('mock.llm'))
  })

  it('renders an empty trace without throwing', () => {
    expect(layoutTrace({ traceId: 'empty', name: 'empty', spans: [] }).spans).toEqual([])
  })
})
