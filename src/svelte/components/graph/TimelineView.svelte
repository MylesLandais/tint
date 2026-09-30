<script lang="ts">
  import { emptySelection, projectTimeline, type GraphSelection, type TimelineInterval } from '../../../core/graph'
  import type { TimelineViewProps } from './types'

  const NUDGE = .02
  let { document: graphDocument, spans, variant = 'gantt', selection: selectionProp,
    class: className, className: legacyClassName, onSpanChange, onSelectionChange, onCommand }: TimelineViewProps = $props()
  let projection = $derived(projectTimeline(graphDocument, spans, { variant }))
  let domain = $derived(Math.max(projection.end - projection.start, 1))
  let selection = $derived(selectionProp ?? emptySelection())
  let editable = $derived(variant === 'range' && onSpanChange !== undefined)
  let dragging = $state<{ id: string; edge: 'start' | 'end'; pointerId: number } | null>(null)

  function select(interval: TimelineInterval) {
    if (!interval.nodeId) return
    const next: GraphSelection = { nodeIds: new Set([interval.nodeId]), edgeIds: new Set(), groupIds: new Set(),
      primary: { kind: 'node', id: interval.nodeId } }
    onCommand?.({ type: 'selection.replace', selection: next })
    onSelectionChange?.(next)
  }

  function update(interval: TimelineInterval, edge: 'start' | 'end', value: number) {
    if (edge === 'start') onSpanChange?.(interval.id, { start: Math.min(value, interval.end), end: interval.end })
    else onSpanChange?.(interval.id, { start: interval.start, end: Math.max(value, interval.start) })
  }

  function handlePointerMove(event: PointerEvent, interval: TimelineInterval) {
    if (!dragging || dragging.id !== interval.id || dragging.pointerId !== event.pointerId) return
    const lane = (event.currentTarget as HTMLElement).closest('.bar')?.parentElement
    const rect = lane?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    update(interval, dragging.edge, projection.start + fraction * domain)
  }

  function nudge(event: KeyboardEvent, interval: TimelineInterval, edge: 'start' | 'end') {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowUp'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowDown'
    if (!forward && !backward) return
    event.preventDefault()
    update(interval, edge, (edge === 'start' ? interval.start : interval.end) + (forward ? 1 : -1) * NUDGE * domain)
  }
</script>

<div data-tint-timeline="" data-variant={variant} class={['timeline', className, legacyClassName].filter(Boolean).join(' ')}>
  {#if projection.tracks.length === 0 || spans.length === 0}
    <p class="empty">No spans for this graph.</p>
  {:else}
    <ol class="tracks" aria-label={`${variant} timeline`}>
      {#each projection.tracks as track (track.id)}
        <li class="track">
          <span class="track-label" title={track.label}>{track.label}</span>
          <div class="lane">
            {#each track.intervals as interval (interval.id)}
              <div class="bar" data-status={interval.status ?? 'ready'} data-selected={interval.nodeId != null && selection.nodeIds.has(interval.nodeId)}
                style:left={`${((interval.start - projection.start) / domain) * 100}%`}
                style:width={`${Math.max((interval.end - interval.start) / domain, .004) * 100}%`}
                style:margin-inline-start={`${interval.depth * .6}rem`}>
                <button type="button" class="bar-body" title={`${interval.label} — ${Math.round(interval.end - interval.start)}`} onclick={() => select(interval)}>
                  <span class="bar-label">{interval.label}</span>
                </button>
                {#if editable}
                  {#each ['start', 'end'] as edge (edge)}
                    <span class="handle" data-edge={edge} role="slider" tabindex="0"
                      aria-label={`${interval.label} ${edge}`} aria-valuemin={projection.start} aria-valuemax={projection.start + domain}
                      aria-valuenow={edge === 'start' ? interval.start : interval.end}
                      onpointerdown={(event) => { event.preventDefault(); dragging = { id: interval.id, edge: edge as 'start' | 'end', pointerId: event.pointerId }; (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId) }}
                      onpointermove={(event) => handlePointerMove(event, interval)}
                      onpointerup={(event) => { dragging = null; (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId) }}
                      onpointercancel={() => { dragging = null }}
                      onkeydown={(event) => nudge(event, interval, edge as 'start' | 'end')}></span>
                  {/each}
                {/if}
              </div>
            {/each}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .timeline { min-width: 0; overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  .empty { margin: 0; padding: 1rem; color: var(--tint-muted); font-size: .875rem; }
  .tracks { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .track { display: grid; grid-template-columns: minmax(8rem, 24%) minmax(0, 1fr); min-height: 3rem; border-bottom: 1px solid var(--tint-border); }
  .track:last-child { border-bottom: 0; }
  .track-label { display: flex; align-items: center; min-width: 0; overflow: hidden; padding: .5rem .75rem; border-right: 1px solid var(--tint-border); color: var(--tint-muted); font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
  .lane { position: relative; min-width: 0; min-height: 3rem; background-image: linear-gradient(to right, var(--tint-border) 1px, transparent 1px); background-size: 10% 100%; }
  .bar { position: absolute; top: .5rem; height: 2rem; min-width: .25rem; border: 1px solid var(--tint-accent); border-radius: var(--tint-radius-sm); background: var(--tint-accent-soft); }
  .bar[data-status='running'] { border-color: var(--tint-info); background: var(--tint-info-soft); }
  .bar[data-status='succeeded'] { border-color: var(--tint-success); background: var(--tint-success-soft); }
  .bar[data-status='failed'], .bar[data-status='error'] { border-color: var(--tint-danger); background: var(--tint-danger-soft); }
  .bar[data-status='warning'] { border-color: var(--tint-warning); background: var(--tint-warning-soft); }
  .bar[data-selected='true'] { outline: 2px solid var(--tint-accent); outline-offset: 1px; }
  .bar-body { width: 100%; height: 100%; overflow: hidden; padding: 0 .5rem; border: 0; background: transparent; color: var(--tint-ink); font: inherit; text-align: left; cursor: pointer; }
  .bar-label { display: block; overflow: hidden; font-size: .6875rem; text-overflow: ellipsis; white-space: nowrap; }
  .handle { position: absolute; z-index: 1; top: -.125rem; width: .5rem; height: 2.25rem; border-radius: var(--tint-radius-sm); background: var(--tint-accent); cursor: ew-resize; touch-action: none; }
  .handle[data-edge='start'] { left: -.25rem; }
  .handle[data-edge='end'] { right: -.25rem; }
  .handle:focus-visible, .bar-body:focus-visible { outline: 2px solid var(--tint-focus, var(--tint-accent)); outline-offset: 2px; }
</style>
