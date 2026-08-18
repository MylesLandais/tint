/**
 * OpenTelemetry-shaped spans for observing agent conversations.
 *
 * Tint does not export traces, talk to a collector, or choose a vendor.
 * Hosts pass already-recorded spans; this module lays them out.
 */

export type TelemetrySpanKind =
  | 'internal'
  | 'client'
  | 'server'
  | 'producer'
  | 'consumer'

export type TelemetrySpanStatus = 'unset' | 'ok' | 'error'

export type TelemetryAttributeValue = string | number | boolean

export type TelemetrySpanEvent = {
  name: string
  timeMs: number
  attributes?: Readonly<Record<string, TelemetryAttributeValue>>
}

/**
 * One timed operation inside a trace. `startMs` / `endMs` are absolute or
 * relative — the waterfall only cares that they share an origin.
 */
export type TelemetrySpan = {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  /** ClickHouse-style service name; drives colour and the topology graph. */
  service: string
  kind: TelemetrySpanKind
  status: TelemetrySpanStatus
  startMs: number
  endMs: number
  attributes?: Readonly<Record<string, TelemetryAttributeValue>>
  /** LangSmith-style payload captured at the span boundary. */
  input?: unknown
  output?: unknown
  events?: readonly TelemetrySpanEvent[]
}

export type TelemetryTrace = {
  traceId: string
  name: string
  spans: readonly TelemetrySpan[]
}

export type TraceWaterfallProps = {
  trace: TelemetryTrace
  selectedSpanId?: string | null
  onSelectedSpanIdChange?: (spanId: string | null) => void
  className?: string
}

export type TraceMetricsProps = {
  trace: TelemetryTrace
  className?: string
}

export type TraceSpanDetailProps = {
  span: TelemetrySpan | null
  className?: string
}

export type TraceServiceMapProps = {
  trace: TelemetryTrace
  selectedService?: string | null
  onSelectedServiceChange?: (service: string | null) => void
  className?: string
}

export type TraceViewerProps = {
  trace: TelemetryTrace
  selectedSpanId?: string | null
  onSelectedSpanIdChange?: (spanId: string | null) => void
  className?: string
}
