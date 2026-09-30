<script lang="ts">
  import { beatToPixel, timelineVisibleRange } from '../../../core/timeline/viewport'
  import type { TransitionRegionProps } from './types'

  let { viewport, startBeat, endBeat, label, class: className }: TransitionRegionProps = $props()
  let region = $derived.by(() => {
    if (!Number.isFinite(startBeat) || !Number.isFinite(endBeat) || endBeat <= startBeat) {
      throw new RangeError('Transition region must have finite increasing beat bounds')
    }
    const visible = timelineVisibleRange(viewport)
    const start = Math.max(startBeat, visible.startBeat)
    const end = Math.min(endBeat, visible.endBeat)
    return end <= start ? null : { left: beatToPixel(viewport, start), width: beatToPixel(viewport, end) - beatToPixel(viewport, start) }
  })
</script>

{#if region}
  <div role="region" aria-label={label} data-tint-transition-region=""
    class={className ?? 'absolute inset-y-0 border-x border-tint-accent/70 bg-tint-accent/15'}
    style:left={`${region.left}px`} style:width={`${region.width}px`}></div>
{/if}
