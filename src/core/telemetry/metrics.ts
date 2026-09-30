import { durationOf } from './layout'
import type { TelemetryTrace } from './types'

export type TraceMetricsSummary = {
  spanCount: number
  errorCount: number
  durationMs: number
  p50Ms: number
  p95Ms: number
  services: readonly string[]
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = (sorted.length - 1) * p
  const low = Math.floor(index)
  const high = Math.ceil(index)
  if (low === high) return sorted[low]!
  return sorted[low]! + (sorted[high]! - sorted[low]!) * (index - low)
}

/**
 * RED-style snapshot: rate as span count, errors, duration as wall time plus
 * p50/p95 of individual spans (ClickHouse trace metrics, LangSmith latency).
 */
export function deriveTraceMetrics(trace: TelemetryTrace): TraceMetricsSummary {
  const spanCount = trace.spans.length
  const errorCount = trace.spans.filter((span) => span.status === 'error').length
  const originMs = spanCount === 0 ? 0 : Math.min(...trace.spans.map((span) => span.startMs))
  const endMs = spanCount === 0 ? 0 : Math.max(...trace.spans.map((span) => span.endMs))
  const durations = trace.spans.map(durationOf).sort((left, right) => left - right)
  const services = [...new Set(trace.spans.map((span) => span.service))].sort()

  return {
    spanCount,
    errorCount,
    durationMs: Math.max(0, endMs - originMs),
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    services,
  }
}
