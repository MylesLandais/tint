import type { TelemetrySpan, TelemetryTrace } from './types'

/** Theme tokens, hashed per service so a colour stays stable across views. */
const SERVICE_COLORS = [
  'var(--tint-accent)',
  'var(--tint-info)',
  'var(--tint-success)',
  'var(--tint-warning)',
  'var(--tint-code-function)',
  'var(--tint-code-keyword)',
  'var(--tint-code-string)',
  'var(--tint-code-number)',
] as const

export type LaidOutSpan = TelemetrySpan & {
  depth: number
  durationMs: number
  offsetMs: number
  offsetRatio: number
  widthRatio: number
}

export type TraceLayout = {
  originMs: number
  endMs: number
  durationMs: number
  spans: readonly LaidOutSpan[]
}

export function durationOf(span: Pick<TelemetrySpan, 'startMs' | 'endMs'>): number {
  return Math.max(0, span.endMs - span.startMs)
}

export function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  return seconds < 10 ? `${seconds.toFixed(2)}s` : `${seconds.toFixed(1)}s`
}

export function serviceColor(service: string): string {
  let hash = 0
  for (let index = 0; index < service.length; index += 1) {
    hash = (hash * 31 + service.charCodeAt(index)) | 0
  }
  const slot = Math.abs(hash) % SERVICE_COLORS.length
  return SERVICE_COLORS[slot]!
}

function childrenOf(
  spans: readonly TelemetrySpan[],
): Map<string | undefined, TelemetrySpan[]> {
  const ids = new Set(spans.map((span) => span.spanId))
  const grouped = new Map<string | undefined, TelemetrySpan[]>()
  for (const span of spans) {
    const parent =
      span.parentSpanId && ids.has(span.parentSpanId) ? span.parentSpanId : undefined
    const siblings = grouped.get(parent)
    if (siblings) siblings.push(span)
    else grouped.set(parent, [span])
  }
  for (const siblings of grouped.values()) {
    siblings.sort((left, right) => left.startMs - right.startMs || left.spanId.localeCompare(right.spanId))
  }
  return grouped
}

/**
 * Depth-first walk in start-time order, matching LangSmith's run tree and
 * ClickHouse's span waterfall (indent = parent chain, bar = duration).
 */
export function layoutTrace(trace: TelemetryTrace): TraceLayout {
  if (trace.spans.length === 0) {
    return { originMs: 0, endMs: 0, durationMs: 0, spans: [] }
  }

  const originMs = Math.min(...trace.spans.map((span) => span.startMs))
  const endMs = Math.max(...trace.spans.map((span) => span.endMs))
  const durationMs = Math.max(1, endMs - originMs)
  const grouped = childrenOf(trace.spans)
  const ordered: LaidOutSpan[] = []

  const walk = (parentId: string | undefined, depth: number) => {
    for (const span of grouped.get(parentId) ?? []) {
      const spanDuration = durationOf(span)
      const offsetMs = span.startMs - originMs
      ordered.push({
        ...span,
        depth,
        durationMs: spanDuration,
        offsetMs,
        offsetRatio: offsetMs / durationMs,
        widthRatio: Math.max(spanDuration / durationMs, 0.004),
      })
      walk(span.spanId, depth + 1)
    }
  }

  walk(undefined, 0)

  // Spans skipped by a cycle still render, unindented, so the Gantt never lies.
  if (ordered.length !== trace.spans.length) {
    const seen = new Set(ordered.map((span) => span.spanId))
    for (const span of trace.spans) {
      if (seen.has(span.spanId)) continue
      const spanDuration = durationOf(span)
      const offsetMs = span.startMs - originMs
      ordered.push({
        ...span,
        depth: 0,
        durationMs: spanDuration,
        offsetMs,
        offsetRatio: offsetMs / durationMs,
        widthRatio: Math.max(spanDuration / durationMs, 0.004),
      })
    }
  }

  return { originMs, endMs, durationMs, spans: ordered }
}

export function spanById(
  trace: TelemetryTrace,
  spanId: string | null | undefined,
): TelemetrySpan | null {
  if (!spanId) return null
  return trace.spans.find((span) => span.spanId === spanId) ?? null
}
