<script lang="ts">
  import { beatToPixel, timelineVisibleRange } from '../../../core/timeline/viewport'
  import type { BeatGridOverlayProps } from './types'

  let { viewport, beatsPerBar, class: className }: BeatGridOverlayProps = $props()
  let beats = $derived.by(() => {
    if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) throw new RangeError('Beat grid beats per bar must be a positive finite number')
    const visible = timelineVisibleRange(viewport)
    const first = Math.ceil(visible.startBeat)
    const last = Math.floor(visible.endBeat)
    return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index)
  })
</script>

<div aria-hidden="true" data-tint-beat-grid="" class={className}>
  {#each beats as beat (beat)}
    <span data-beat={beat} data-bar-line={String(beat % beatsPerBar === 0)}
      class={beat % beatsPerBar === 0 ? 'absolute inset-y-0 border-l border-current/45' : 'absolute inset-y-0 border-l border-current/15'}
      style:left={`${beatToPixel(viewport, beat)}px`}></span>
  {/each}
</div>
