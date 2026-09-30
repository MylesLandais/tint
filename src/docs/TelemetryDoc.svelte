<script lang="ts">
  import { TraceServiceMap, TraceViewer, type TelemetryTrace } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const trace: TelemetryTrace = {
    traceId: 'demo-trace', name: 'Message request',
    spans: [
      { traceId: 'demo-trace', spanId: 'request', name: 'message.request', service: 'gateway', kind: 'server', status: 'ok', startMs: 0, endMs: 132,
        attributes: { route: '/chat' } },
      { traceId: 'demo-trace', spanId: 'search', parentSpanId: 'request', name: 'context.search', service: 'index', kind: 'client', status: 'ok', startMs: 14, endMs: 52,
        output: { hits: 4 } },
      { traceId: 'demo-trace', spanId: 'generate', parentSpanId: 'request', name: 'response.generate', service: 'model', kind: 'client', status: 'error', startMs: 58, endMs: 124,
        attributes: { model: 'example-model' }, output: { error: 'Timeout' } },
    ],
  }
  let selectedSpanId = $state<string | null>('request')
  let selectedService = $state<string | null>(null)
  const api: ApiRow[] = [
    { prop: 'trace', type: 'TelemetryTrace', description: 'Host-recorded spans; Tint only derives metrics and renders them.' },
    { prop: 'selectedSpanId / onSelectedSpanIdChange', type: 'string | null / callback', description: 'Optional controlled selection in the waterfall and detail panel.' },
    { prop: 'selectedService / onSelectedServiceChange', type: 'string | null / callback', description: 'Optional controlled service node selection.' },
    { prop: 'TraceMetrics / TraceWaterfall / TraceSpanDetail', type: 'Svelte components', description: 'Composable metrics, timing, and selected-span surfaces.' },
  ]
  const usage = `import { TraceViewer, TraceServiceMap } from '@nebula/tint/telemetry'

let selectedSpanId = $state<string | null>(null)
<TraceViewer {trace} {selectedSpanId}
  onSelectedSpanIdChange={(id) => selectedSpanId = id} />
<TraceServiceMap {trace} />`
</script>

<DocPage title="Telemetry" description="Trace timing, service calls, and RED summaries over plain TypeScript span models. Select a span or service to inspect host-recorded details." importPath="@nebula/tint/telemetry" {usage} {api} accessibility="Waterfall rows are selectable options with selected state. Service nodes are named buttons with pressed state, failures include text labels, and span details remain readable without relying on color or hover.">
  <div class="telemetry-demo">
    <TraceViewer {trace} {selectedSpanId} onSelectedSpanIdChange={(id) => selectedSpanId = id} />
    <TraceServiceMap {trace} {selectedService} onSelectedServiceChange={(service) => selectedService = service} />
    <p aria-live="polite">Selected span: {selectedSpanId ?? 'none'} · Service: {selectedService ?? 'none'}</p>
  </div>
</DocPage>

<style>
  .telemetry-demo { display: grid; gap: 1rem; min-width: 0; }
  p { margin: 0; color: var(--tint-muted); font-size: .84rem; }
</style>
