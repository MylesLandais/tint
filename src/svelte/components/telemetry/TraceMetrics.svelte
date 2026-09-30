<script lang="ts">
  import { Activity, AlertTriangle, Clock3 } from '@lucide/svelte'
  import { formatDuration } from '../../../core/telemetry/layout'
  import { deriveTraceMetrics } from '../../../core/telemetry/metrics'
  import type { TraceMetricsProps } from './types'

  let { trace, class: className, className: legacyClassName }: TraceMetricsProps = $props()
  let metrics = $derived(deriveTraceMetrics(trace))
</script>

<section data-trace-metrics="" aria-label="Trace metrics" class={['tint-trace-metrics', className, legacyClassName].filter(Boolean).join(' ')}>
  <div class="cards">
    <article><div class="card-header"><span>Spans</span><Activity size={16} aria-hidden="true" /></div><strong>{metrics.spanCount}</strong><p>{metrics.services.length} {metrics.services.length === 1 ? 'service' : 'services'}</p></article>
    <article class:danger={metrics.errorCount > 0}><div class="card-header"><span>Errors</span><AlertTriangle size={16} aria-hidden="true" /></div><strong>{metrics.errorCount}</strong><p>{metrics.errorCount === 0 ? 'No failed spans' : 'Failed spans in this trace'}</p></article>
    <article><div class="card-header"><span>Duration</span><Clock3 size={16} aria-hidden="true" /></div><strong>{formatDuration(metrics.durationMs)}</strong><p>p50 {formatDuration(metrics.p50Ms)} · p95 {formatDuration(metrics.p95Ms)}</p></article>
  </div>
</section>

<style>
  .tint-trace-metrics { min-width: 0; container-type: inline-size; }
  .cards { display: grid; grid-template-columns: 1fr; gap: .5rem; }
  article { min-width: 0; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  article.danger { border-color: var(--tint-danger); background: var(--tint-danger-soft); }
  .card-header { display: flex; justify-content: space-between; gap: .5rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 500; }
  strong { display: block; margin-top: .25rem; font-size: 1.5rem; line-height: 1.2; font-variant-numeric: tabular-nums; }
  p { margin: .25rem 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  @container (min-width: 34rem) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
