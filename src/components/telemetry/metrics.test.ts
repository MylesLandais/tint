import { describe, expect, it } from 'vitest'
import { deriveTraceMetrics } from './metrics'
import type { TelemetrySpan, TelemetryTrace } from './types'

function span(
  partial: Pick<TelemetrySpan, 'spanId' | 'name' | 'startMs' | 'endMs'> & Partial<TelemetrySpan>,
): TelemetrySpan {
  return {
    traceId: 'trc-metrics',
    service: 'svc',
    kind: 'internal',
    status: 'ok',
    ...partial,
  }
}

describe('deriveTraceMetrics', () => {
  it('reports RED-style span count, errors, wall time, and percentiles', () => {
    const trace: TelemetryTrace = {
      traceId: 'trc-metrics',
      name: 'run',
      spans: [
        span({ spanId: 'a', name: 'a', startMs: 0, endMs: 100 }),
        span({ spanId: 'b', name: 'b', startMs: 10, endMs: 30, service: 'other' }),
        span({
          spanId: 'c',
          name: 'c',
          startMs: 40,
          endMs: 90,
          status: 'error',
          service: 'other',
        }),
      ],
    }

    const metrics = deriveTraceMetrics(trace)
    expect(metrics.spanCount).toBe(3)
    expect(metrics.errorCount).toBe(1)
    expect(metrics.durationMs).toBe(100)
    expect(metrics.p50Ms).toBe(50)
    expect(metrics.services).toEqual(['other', 'svc'])
  })
})
