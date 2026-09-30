<script lang="ts">
  import { clampPercent, pointerPercent } from '../../../core/media/model'

  type Props = {
    value: number
    onChange: (value: number) => void
    'aria-label': string
    orientation?: 'horizontal' | 'vertical'
    showThumb?: boolean
    class?: string
    fillClassName?: string
    thumbClassName?: string
  }

  let {
    value, onChange, 'aria-label': ariaLabel, orientation = 'horizontal',
    showThumb = false, class: className, fillClassName, thumbClassName,
  }: Props = $props()
  let track = $state<HTMLDivElement>(null!)
  let safeValue = $derived(clampPercent(value))

  function updateFromPointer(event: PointerEvent) {
    const rect = track.getBoundingClientRect()
    onChange(orientation === 'vertical'
      ? pointerPercent(event.clientY, rect.top, rect.height, 'vertical')
      : pointerPercent(event.clientX, rect.left, rect.width))
  }

  function onPointerDown(event: PointerEvent) {
    event.preventDefault()
    track.focus()
    track.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  function onPointerMove(event: PointerEvent) {
    if (track.hasPointerCapture(event.pointerId)) updateFromPointer(event)
  }

  function onKeydown(event: KeyboardEvent) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 5
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -5
      : event.key === 'PageUp' ? 5 : event.key === 'PageDown' ? -5 : 0
    if (delta) {
      event.preventDefault()
      onChange(clampPercent(safeValue + delta))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      onChange(event.key === 'Home' ? 0 : 100)
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
  onpointerup={(event) => { if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId) }}
  onpointercancel={(event) => { if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId) }}
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
