import { useMemo, useState } from 'react'
import '../../components/graph/graph.css'
import {
  TraceServiceMap,
  TraceViewer,
  spanById,
  type TelemetryTrace,
} from '../../components/telemetry'
import { demoGroupTrace } from '../chat/demo/mockAgentProvider'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'

const usage = `import { useState } from 'react'
import {
  TraceViewer,
  TraceServiceMap,
  type TelemetryTrace,
} from 'tint/telemetry'
import 'tint/graph/styles.css'

export function AgentTrace({ trace }: { trace: TelemetryTrace }) {
  const [spanId, setSpanId] = useState<string | null>(null)
  const selected = trace.spans.find((span) => span.spanId === spanId)

  return (
    <>
      <TraceViewer
        trace={trace}
        selectedSpanId={spanId}
        onSelectedSpanIdChange={setSpanId}
      />
      <TraceServiceMap
        trace={trace}
        selectedService={selected?.service}
      />
    </>
  )
}`

const waterfallProps = [
  { name: 'trace', type: 'TelemetryTrace', required: true, description: 'The recorded spans to lay out. Tint does not collect or export them.' },
  { name: 'selectedSpanId', type: 'string | null', description: 'Controlled selection. Omit to let the waterfall latch internally via TraceViewer.' },
  { name: 'onSelectedSpanIdChange', type: '(spanId: string | null) => void', description: 'Reports the span the user selected or deselected.' },
  { name: 'className', type: 'string', description: 'Extra classes for the waterfall root.' },
]

const metricsProps = [
  { name: 'trace', type: 'TelemetryTrace', required: true, description: 'Source for span count, errors, wall duration, and p50/p95.' },
  { name: 'className', type: 'string', description: 'Extra classes for the metrics grid.' },
]

const detailProps = [
  { name: 'span', type: 'TelemetrySpan | null', required: true, description: 'The span to inspect. Null renders the empty prompt.' },
  { name: 'className', type: 'string', description: 'Extra classes for the inspector.' },
]

const viewerProps = [
  { name: 'trace', type: 'TelemetryTrace', required: true, description: 'Metrics, waterfall, and span inspector for one trace.' },
  { name: 'selectedSpanId', type: 'string | null', description: 'Controlled waterfall selection. Omit to latch internally.' },
  { name: 'onSelectedSpanIdChange', type: '(spanId: string | null) => void', description: 'Fires when the selected span changes, controlled or not.' },
  { name: 'className', type: 'string', description: 'Extra classes for the viewer stack.' },
]

const serviceMapProps = [
  { name: 'trace', type: 'TelemetryTrace', required: true, description: 'Parent→child spans become a service topology on InteractiveGraphView.' },
  { name: 'selectedService', type: 'string | null', description: 'Controlled graph selection keyed by service name.' },
  { name: 'onSelectedServiceChange', type: '(service: string | null) => void', description: 'The service node the user selected on the canvas.' },
  { name: 'className', type: 'string', description: 'Extra classes for the map shell.' },
]

function withReplay(trace: TelemetryTrace): TelemetryTrace {
  return {
    ...trace,
    spans: [
      ...trace.spans,
      {
        traceId: trace.traceId,
        spanId: 'sp-maya-tts-replay-1-1',
        parentSpanId: 'sp-maya-1',
        name: 'tts.replay',
        service: 'mock.tts',
        kind: 'client',
        status: 'ok',
        startMs: 1280,
        endMs: 1316,
        attributes: {
          'tts.cache': 'hit',
          'tts.src': '/audio/maya.wav',
          'tts.voice': 'maya',
        },
      },
    ],
  }
}

export function TelemetryDoc() {
  const trace = useMemo(() => withReplay(demoGroupTrace()), [])
  const [spanId, setSpanId] = useState<string | null>(trace.spans[0]?.spanId ?? null)
  const selected = spanById(trace, spanId)

  return (
    <DocsPage
      route="components/telemetry"
      title="Telemetry"
      intro="LangSmith-shaped run trees and ClickHouse-shaped service colour, waterfall Gantt, and topology — for traces the host already recorded. Tint never talks to a collector."
      note={
        <>
          The Gantt is first-party SVG. The service map is a readonly{' '}
          <code>InteractiveGraphView</code>, so xyflow stays behind{' '}
          <code>tint/graph</code>. Import <code>tint/graph/styles.css</code> when
          you render the map.
        </>
      }
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="A mocked group conversation: user → Maya (LLM + cached TTS) → Jordan (LLM + cached TTS), then a Replay span on the same trace."
      >
        <DocsPreview className="grid gap-4">
          <TraceViewer
            trace={trace}
            selectedSpanId={spanId}
            onSelectedSpanIdChange={setSpanId}
          />
        </DocsPreview>
      </DocsSection>

      <DocsSection
        id="service-map"
        title="Service map"
        description="Distinct services become graph nodes; parent→child spans that cross a service boundary become edges."
      >
        <DocsPreview>
          <TraceServiceMap
            trace={trace}
            selectedService={selected?.service}
            onSelectedServiceChange={(service) => {
              if (!service) {
                setSpanId(null)
                return
              }
              const match = trace.spans.find((span) => span.service === service)
              setSpanId(match?.spanId ?? null)
            }}
          />
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <h3 className="mt-0 mb-3 text-base font-semibold text-tint-ink">TraceViewer</h3>
        <PropsTable rows={viewerProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">TraceWaterfall</h3>
        <PropsTable rows={waterfallProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">TraceMetrics</h3>
        <PropsTable rows={metricsProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">TraceSpanDetail</h3>
        <PropsTable rows={detailProps} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">TraceServiceMap</h3>
        <PropsTable rows={serviceMapProps} />
      </DocsSection>
    </DocsPage>
  )
}
