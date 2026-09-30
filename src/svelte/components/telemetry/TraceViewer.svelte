<script lang="ts">
  import { untrack } from 'svelte'
  import { spanById } from '../../../core/telemetry/layout'
  import TraceMetrics from './TraceMetrics.svelte'
  import TraceSpanDetail from './TraceSpanDetail.svelte'
  import TraceWaterfall from './TraceWaterfall.svelte'
  import type { TraceViewerProps } from './types'

  let { trace, selectedSpanId, onSelectedSpanIdChange,
    class: className, className: legacyClassName }: TraceViewerProps = $props()
  let uncontrolled = $state<string | null>(untrack(() => trace.spans[0]?.spanId ?? null))
  let selected = $derived(selectedSpanId === undefined ? uncontrolled : selectedSpanId)

  function selectSpan(next: string | null) {
    if (selectedSpanId === undefined) uncontrolled = next
    onSelectedSpanIdChange?.(next)
  }
</script>

<div data-trace-viewer="" class={['tint-trace-viewer', className, legacyClassName].filter(Boolean).join(' ')}>
  <TraceMetrics {trace} />
  <div class="detail-layout">
    <TraceWaterfall {trace} selectedSpanId={selected} onSelectedSpanIdChange={selectSpan} />
    <TraceSpanDetail span={spanById(trace, selected)} />
  </div>
</div>

<style>
  .tint-trace-viewer { display: grid; min-width: 0; gap: .75rem; container-type: inline-size; }
  .detail-layout { display: grid; min-width: 0; gap: .75rem; }
  @container (min-width: 54rem) { .detail-layout { grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 1fr); } }
</style>
