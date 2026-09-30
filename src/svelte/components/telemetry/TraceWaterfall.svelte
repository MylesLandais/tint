<script lang="ts">
  import { tick } from 'svelte'
  import { formatDuration, layoutTrace, serviceColor } from '../../../core/telemetry/layout'
  import type { TraceWaterfallProps } from './types'

  let { trace, selectedSpanId, onSelectedSpanIdChange,
    class: className, className: legacyClassName }: TraceWaterfallProps = $props()
  let layout = $derived(layoutTrace(trace))
  let rows = $state<HTMLDivElement | null>(null)
  let focusedIndex = $state(0)

  $effect(() => {
    const index = layout.spans.findIndex((span) => span.spanId === selectedSpanId)
    if (index >= 0) focusedIndex = index
  })

  function move(event: KeyboardEvent, index: number) {
    let next = index
    if (event.key === 'ArrowDown') next = Math.min(layout.spans.length - 1, index + 1)
    else if (event.key === 'ArrowUp') next = Math.max(0, index - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = layout.spans.length - 1
    else return
    event.preventDefault()
    focusedIndex = next
    onSelectedSpanIdChange?.(layout.spans[next].spanId)
    void tick().then(() => rows?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.focus())
  }
</script>

<section data-trace-waterfall="" class={['tint-trace-waterfall', className, legacyClassName].filter(Boolean).join(' ')}>
  <header>
    <div class="identity"><h3>{trace.name}</h3><p>{trace.traceId}</p></div>
    <span class="total">{formatDuration(layout.durationMs)}</span>
  </header>
  <div class="overview" aria-hidden="true">
    {#each layout.spans as span (span.spanId)}
      <span class="overview-bar" style:left={`${span.offsetRatio * 100}%`}
        style:width={`${span.widthRatio * 100}%`}
        style:background={span.status === 'error' ? 'var(--tint-danger)' : serviceColor(span.service)}></span>
    {/each}
  </div>
  {#if layout.spans.length === 0}
    <p class="empty">No spans in this trace.</p>
  {:else}
    <div bind:this={rows} class="rows" role="listbox" aria-label="Trace waterfall">
      {#each layout.spans as span, index (span.spanId)}
        {@const selected = selectedSpanId === span.spanId}
        <button type="button" role="option" aria-selected={selected} class:selected
          tabindex={focusedIndex === index ? 0 : -1}
          onfocus={() => { focusedIndex = index }}
          onkeydown={(event) => move(event, index)}
          onclick={() => onSelectedSpanIdChange?.(span.spanId)}>
          <span class="row-label" style:padding-left={`${0.75 + span.depth * 0.75}rem`}>
            <span class="name">{span.name}</span>
            <span class="service">{span.service} · {formatDuration(span.durationMs)}</span>
          </span>
          <span class="timeline">
            <span class="bar" class:selected data-trace-bar="" data-status={span.status}
              style:left={`${span.offsetRatio * 100}%`}
              style:width={`${span.widthRatio * 100}%`}
              style:background={span.status === 'error' ? 'var(--tint-danger)' : serviceColor(span.service)}></span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
  <footer><span>0ms</span><span>{formatDuration(layout.durationMs)}</span></footer>
</section>

<style>
  .tint-trace-waterfall { min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .5rem .75rem; border-bottom: 1px solid var(--tint-border); }
  .identity { min-width: 0; }
  h3, p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  h3 { font-size: var(--tint-font-size-sm); font-weight: 600; }
  .identity p { margin-top: .125rem; color: var(--tint-muted); font: .6875rem var(--font-mono); }
  .total { flex: none; color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  .overview { position: relative; height: 2rem; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); }
  .overview-bar { position: absolute; top: .5rem; height: 1rem; border-radius: 2px; opacity: .8; }
  .rows { max-height: 22rem; overflow: auto; }
  button { display: grid; grid-template-columns: minmax(11rem, 32%) minmax(0, 1fr); width: 100%; min-height: 2.5rem; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
  button:hover, button:focus-visible, button.selected { background: var(--tint-accent-soft); }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  .row-label { display: flex; min-width: 0; flex-direction: column; justify-content: center; padding-block: .375rem; padding-right: .5rem; border-right: 1px solid var(--tint-border); }
  .name, .service { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .name { font-size: var(--tint-font-size-xs); font-weight: 500; }
  .service { color: var(--tint-muted); font: .625rem var(--font-mono); }
  .timeline { position: relative; min-width: 0; }
  .bar { position: absolute; top: 50%; height: .875rem; border-radius: 2px; transform: translateY(-50%); }
  .bar.selected { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .empty { padding: 1.5rem .75rem; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  footer { display: flex; justify-content: space-between; padding: .25rem .75rem; border-top: 1px solid var(--tint-border); color: var(--tint-muted); font: .625rem var(--font-mono); }
</style>
