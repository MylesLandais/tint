import type { TelemetrySpan, TelemetryTrace } from '../../../core/telemetry/types'

export type TraceWaterfallProps = {
  trace: TelemetryTrace
  selectedSpanId?: string | null
  onSelectedSpanIdChange?: (spanId: string | null) => void
  class?: string
  className?: string
}

export type TraceMetricsProps = {
  trace: TelemetryTrace
  class?: string
  className?: string
}

export type TraceSpanDetailProps = {
  span: TelemetrySpan | null
  class?: string
  className?: string
}

export type TraceServiceMapProps = {
  trace: TelemetryTrace
  selectedService?: string | null
  onSelectedServiceChange?: (service: string | null) => void
  class?: string
  className?: string
}

export type TraceViewerProps = {
  trace: TelemetryTrace
  selectedSpanId?: string | null
  onSelectedSpanIdChange?: (spanId: string | null) => void
  class?: string
  className?: string
}
