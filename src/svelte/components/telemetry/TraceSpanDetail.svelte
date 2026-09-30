<script lang="ts">
  import { durationOf, formatDuration, serviceColor } from '../../../core/telemetry/layout'
  import type { TraceSpanDetailProps } from './types'

  let { span, class: className, className: legacyClassName }: TraceSpanDetailProps = $props()
  let entries = $derived(Object.entries(span?.attributes ?? {}))
</script>

{#if !span}
  <div data-trace-span-detail="" class={['tint-trace-span-detail', 'placeholder', className, legacyClassName].filter(Boolean).join(' ')}>
    Select a span in the waterfall to inspect input, output, and attributes.
  </div>
{:else}
  <article data-trace-span-detail="" class={['tint-trace-span-detail', className, legacyClassName].filter(Boolean).join(' ')}>
    <header>
      <div class="identity"><h3>{span.name}</h3><p><span class="service-dot" style:background={serviceColor(span.service)} aria-hidden="true"></span>{span.service}</p></div>
      <span class="status" class:error={span.status === 'error'}>{span.status}</span>
    </header>
    <dl class="fields">
      <div><dt>Duration</dt><dd>{formatDuration(durationOf(span))}</dd></div>
      <div><dt>Kind</dt><dd>{span.kind}</dd></div>
      <div><dt>Span</dt><dd>{span.spanId}</dd></div>
      <div><dt>Parent</dt><dd>{span.parentSpanId ?? '—'}</dd></div>
    </dl>
    {#if entries.length > 0}
      <section><h4>Attributes</h4><dl class="attributes">
        {#each entries as [key, value] (key)}
          <div><dt>{key}</dt><dd>{String(value)}</dd></div>
        {/each}
      </dl></section>
    {/if}
    {#if span.input !== undefined}<section><h4>Input</h4><pre>{JSON.stringify(span.input, null, 2)}</pre></section>{/if}
    {#if span.output !== undefined}<section><h4>Output</h4><pre>{JSON.stringify(span.output, null, 2)}</pre></section>{/if}
    {#if span.events && span.events.length > 0}
      <section><h4>Events</h4><ul>
        {#each span.events as event, index (`${event.name}-${index}`)}
          <li>{event.name}<span> @ {formatDuration(event.timeMs)}</span></li>
        {/each}
      </ul></section>
    {/if}
  </article>
{/if}

<style>
  .tint-trace-span-detail { min-width: 0; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  .placeholder { padding-block: 1.5rem; border-style: dashed; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .75rem; }
  .identity { min-width: 0; }
  h3, p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  h3 { font-size: var(--tint-font-size-sm); font-weight: 600; }
  .identity p { display: flex; align-items: center; gap: .375rem; margin-top: .125rem; color: var(--tint-muted); font: .6875rem var(--font-mono); }
  .service-dot { display: inline-block; width: .5rem; height: .5rem; flex: none; border-radius: 50%; }
  .status { flex: none; padding: .125rem .375rem; border-radius: var(--tint-radius-sm); background: var(--tint-success-soft); color: var(--tint-success-ink); font-size: .625rem; font-weight: 600; text-transform: uppercase; }
  .status.error { background: var(--tint-danger-soft); color: var(--tint-danger-ink); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; margin: 0 0 .75rem; }
  dt { color: var(--tint-muted); }
  .fields dt, h4 { font-size: .625rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
  dd { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: .75rem var(--font-mono); }
  section { margin-top: .75rem; }
  h4 { margin: 0 0 .375rem; color: var(--tint-muted); }
  .attributes { display: grid; gap: .25rem; margin: 0; }
  .attributes div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .5rem; font-size: .6875rem; }
  .attributes dt, .attributes dd { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: .6875rem var(--font-mono); }
  pre { max-width: 100%; margin: 0; overflow: auto; padding: .5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-ink); font: .6875rem/1.5 var(--font-mono); }
  ul { display: grid; gap: .25rem; margin: 0; padding: 0; list-style: none; }
  li { padding: .25rem .5rem; border-radius: var(--tint-radius-sm); background: var(--tint-surface); font: .6875rem var(--font-mono); }
  li span { color: var(--tint-muted); }
</style>
