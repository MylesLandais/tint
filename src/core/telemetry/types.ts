/** Host-recorded spans. Tint only derives and displays them; it does not collect them. */
export type TelemetrySpanKind = 'internal' | 'client' | 'server' | 'producer' | 'consumer'
export type TelemetrySpanStatus = 'unset' | 'ok' | 'error'
export type TelemetryAttributeValue = string | number | boolean

export type TelemetrySpanEvent = {
  name: string
  timeMs: number
  attributes?: Readonly<Record<string, TelemetryAttributeValue>>
}

export type TelemetrySpan = {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  service: string
  kind: TelemetrySpanKind
  status: TelemetrySpanStatus
  startMs: number
  endMs: number
  attributes?: Readonly<Record<string, TelemetryAttributeValue>>
  input?: unknown
  output?: unknown
  events?: readonly TelemetrySpanEvent[]
}

export type TelemetryTrace = {
  traceId: string
  name: string
  spans: readonly TelemetrySpan[]
}
