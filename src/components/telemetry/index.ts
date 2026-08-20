/**
 * Observability surfaces for already-recorded agent traces.
 *
 * What is deliberately *not* here: collectors, exporters, and the mock chat/TTS
 * provider. Those belong in the host (the docs demo lives in `src/docs/chat/demo/`).
 * The waterfall is first-party SVG; the service map reuses `tint/graph`.
 */
export type {
  TelemetryAttributeValue,
  TelemetrySpan,
  TelemetrySpanEvent,
  TelemetrySpanKind,
  TelemetrySpanStatus,
  TelemetryTrace,
  TraceMetricsProps,
  TraceServiceMapProps,
  TraceSpanDetailProps,
  TraceViewerProps,
  TraceWaterfallProps,
} from './types'

export { layoutTrace, formatDuration, serviceColor, spanById, durationOf } from './layout'
export type { LaidOutSpan, TraceLayout } from './layout'
export { deriveTraceMetrics } from './metrics'
export type { TraceMetricsSummary } from './metrics'
export { graphDocumentFromTrace, runtimeByService } from './serviceMap'
export { TraceWaterfall } from './TraceWaterfall'
export { TraceMetrics } from './TraceMetrics'
export { TraceSpanDetail } from './TraceSpanDetail'
export { TraceServiceMap } from './TraceServiceMap'
export { TraceViewer } from './TraceViewer'
