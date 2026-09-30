/** Legacy React props, with the recorded trace model shared with the Svelte layer. */
import type { TelemetrySpan, TelemetryTrace } from '../../core/telemetry/types'

export type {
  TelemetryAttributeValue,
  TelemetrySpan,
  TelemetrySpanEvent,
  TelemetrySpanKind,
  TelemetrySpanStatus,
  TelemetryTrace,
} from '../../core/telemetry/types'

export type TraceWaterfallProps = {
  trace: TelemetryTrace
  selectedSpanId?: string | null
  onSelectedSpanIdChange?: (spanId: string | null) => void
  className?: string
}

export type TraceMetricsProps = { trace: TelemetryTrace; className?: string }
export type TraceSpanDetailProps = { span: TelemetrySpan | null; className?: string }
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
