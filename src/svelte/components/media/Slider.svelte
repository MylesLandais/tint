<script lang="ts">
  import { clampPercent, pointerPercent } from '../../../core/media/model'

  type Props = {
    value: number
    onChange: (value: number) => void
    /** Commit one completed gesture; intermediate changes remain local to the host. */
    onCommit?: (value: number) => void
    'aria-label': string
    orientation?: 'horizontal' | 'vertical'
    showThumb?: boolean
    class?: string
    fillClassName?: string
    thumbClassName?: string
  }

  let {
    value, onChange, onCommit, 'aria-label': ariaLabel, orientation = 'horizontal',
    showThumb = false, class: className, fillClassName, thumbClassName,
  }: Props = $props()
  let track = $state<HTMLDivElement>(null!)
  let draft = $state<number | null>(null)
  let origin = 0
  let active = false
  const held = new Set<string>()
  let safeValue = $derived(draft ?? clampPercent(value))

  function begin() {
    if (!active) { origin = clampPercent(value); active = true; draft = origin }
  }
  function update(next: number) { draft = clampPercent(next); onChange(draft) }
  function finish() {
    if (!active) return
    const next = draft ?? origin
    active = false; held.clear(); draft = null
    if (next !== origin) onCommit?.(next)
  }
  function cancel() {
    if (!active) return
    active = false; held.clear(); draft = null; onChange(origin)
  }
  function updateFromPointer(event: PointerEvent) {
    const rect = track.getBoundingClientRect()
    update(orientation === 'vertical'
      ? pointerPercent(event.clientY, rect.top, rect.height, 'vertical')
      : pointerPercent(event.clientX, rect.left, rect.width))
  }
  function onPointerDown(event: PointerEvent) {
    event.preventDefault(); track.focus(); begin()
    track.setPointerCapture(event.pointerId); updateFromPointer(event)
  }
  function onPointerMove(event: PointerEvent) {
    if (track.hasPointerCapture(event.pointerId)) updateFromPointer(event)
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); cancel(); return }
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 5
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -5 : 0
    if (delta) {
      event.preventDefault(); begin(); held.add(event.key); update(safeValue + delta)
    } else if (['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault()
      if (event.repeat) return
      begin()
      update(event.key === 'Home' ? 0 : event.key === 'End' ? 100 : safeValue + (event.key === 'PageUp' ? 5 : -5))
      finish()
    }
  }

</script>

<div
  bind:this={track}
  role="slider"
  tabindex="0"
  aria-label={ariaLabel}
  aria-orientation={orientation}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={Math.round(safeValue)}
  data-orientation={orientation}
  class={['tint-media-slider', className].filter(Boolean).join(' ')}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={(event) => { finish(); if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId) }}
  onpointercancel={(event) => { cancel(); if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId) }}
  onlostpointercapture={cancel}
  onblur={cancel}
  onkeyup={(event) => { if (held.delete(event.key) && held.size === 0) finish() }}
  onkeydown={onKeydown}
>
  <span class={['fill', fillClassName].filter(Boolean).join(' ')} style={orientation === 'vertical' ? `height:${safeValue}%` : `width:${safeValue}%`}></span>
  {#if showThumb}
    <span aria-hidden="true" class={['thumb', thumbClassName].filter(Boolean).join(' ')} style={orientation === 'vertical' ? `bottom:${safeValue}%` : `left:${safeValue}%`}></span>
  {/if}
</div>

<style>
  .tint-media-slider { position: relative; width: 100%; height: .25rem; border-radius: var(--tint-radius-full); background: color-mix(in srgb, currentColor 20%, transparent); color: var(--tint-ink); cursor: pointer; outline: none; touch-action: none; }
  .tint-media-slider[data-orientation='vertical'] { width: .25rem; height: 100%; }
  .tint-media-slider:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 4px; }
  .fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: inherit; background: currentColor; transition: width var(--tint-motion-base) var(--tint-ease), height var(--tint-motion-base) var(--tint-ease); }
  [data-orientation='vertical'] .fill { top: auto; bottom: 0; width: 100%; }
  .thumb { position: absolute; top: 50%; width: .375rem; height: .75rem; border-radius: var(--tint-radius-sm); background: currentColor; transform: translate(-50%, -50%); transition: left var(--tint-motion-base) var(--tint-ease), bottom var(--tint-motion-base) var(--tint-ease); pointer-events: none; }
  [data-orientation='vertical'] .thumb { top: auto; left: 50%; width: .75rem; height: .375rem; transform: translate(-50%, 50%); }
  @media (prefers-reduced-motion: reduce) { .fill, .thumb { transition: none; } }
</style>
