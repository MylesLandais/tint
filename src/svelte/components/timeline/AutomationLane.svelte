<script lang="ts">
  import { beatToPixel, timelineVisibleRange } from '../../../core/timeline/viewport'
  import type { AutomationLaneProps } from './types'

  let { viewport, label, points, min = 0, max = 1, step = .01, onPointChange, class: className }: AutomationLaneProps = $props()
  let visible = $derived(timelineVisibleRange(viewport))
  let validPoints = $derived.by(() => {
    if (![min, max, step].every(Number.isFinite) || max <= min || step <= 0) throw new RangeError('Automation lane range must be finite and increasing')
    points.forEach((point, index) => {
      if (!Number.isFinite(point.beat) || !Number.isFinite(point.value)) throw new RangeError('Automation points must contain finite values')
      if (index > 0 && point.beat < points[index - 1]!.beat) throw new RangeError('Automation points must be ordered by beat')
    })
    return points
  })
  function valueToPercent(value: number) { return 100 - ((value - min) / (max - min)) * 100 }
  function change(event: Event, index: number, beat: number, originalValue: number) {
    const input = event.currentTarget as HTMLInputElement
    onPointChange(index, { beat, value: Number(input.value) })
    input.value = String(originalValue)
  }
</script>

<section aria-label={label} data-tint-automation-lane=""
  class={className ?? 'relative h-24 overflow-hidden rounded-md border border-tint-border bg-tint-surface'}>
  <span class="sr-only">{label}</span>
  <svg aria-hidden="true" class="absolute inset-0 size-full" preserveAspectRatio="none">
    {#each validPoints.slice(0, -1) as point, index (`${point.beat}-${index}`)}
      {@const next = validPoints[index + 1]!}
      <line data-automation-segment="" x1={beatToPixel(viewport, point.beat)} y1={`${valueToPercent(point.value)}%`}
        x2={beatToPixel(viewport, next.beat)} y2={`${valueToPercent(next.value)}%`}
        stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"></line>
    {/each}
  </svg>
  {#each validPoints as point, index (`${point.beat}-${index}`)}
    {#if point.beat >= visible.startBeat && point.beat <= visible.endBeat}
      <input type="range" aria-label={`${label} point ${index + 1}`} {min} {max} {step} value={point.value}
        class="absolute z-10 h-11 w-20 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize appearance-none bg-transparent"
        style:left={`${beatToPixel(viewport, point.beat)}px`} style:top={`${valueToPercent(point.value)}%`}
        onchange={(event) => change(event, index, point.beat, point.value)} />
    {/if}
  {/each}
</section>
