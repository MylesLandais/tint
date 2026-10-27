<script lang="ts">
  import { splitPaneMode } from '../../../core/feed'
  import ResizeHandle from '../shell/ResizeHandle.svelte'
  import type { SplitPaneProps } from './types'

  let {
    start, middle, end, startWidth = '14rem', middleWidth = '1fr', endWidth = '22rem',
    onStartWidthChange, onMiddleWidthChange, minPanePx = 120,
    class: className, ...rest
  }: SplitPaneProps = $props()

  let root = $state<HTMLDivElement>()
  let startPane = $state<HTMLDivElement>()
  let middlePane = $state<HTMLDivElement>()
  let containerWidth = $state(0)
  let startMeasured = $state(0)
  let middleMeasured = $state(0)
  let mode = $derived(splitPaneMode(containerWidth, Boolean(end)))
  let columns = $derived(end ? `${startWidth} 6px ${middleWidth} 6px ${endWidth}` : `${startWidth} 6px ${middleWidth}`)
  const id = $props.id()

  $effect(() => {
    const node = root
    const first = startPane
    const second = middlePane
    if (!node || !first || !second) return
    const measure = () => {
      containerWidth = node.getBoundingClientRect().width
      startMeasured = first.getBoundingClientRect().width
      middleMeasured = second.getBoundingClientRect().width
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    observer.observe(first)
    observer.observe(second)
    return () => observer.disconnect()
  })

</script>

<div {...rest} bind:this={root} data-tint-split-pane="" data-panes={end ? 3 : 2} data-layout={mode} class={['split-pane', className].filter(Boolean).join(' ')} style:--split-columns={columns}>
  <div class="split-grid">
    <div bind:this={startPane} id={`${id}-start`} data-tint-split-pane-start="" class="pane">{@render start()}</div>
    <ResizeHandle label="Resize start pane" size={Math.round(startMeasured)} minSize={minPanePx}
      maxSize={Math.max(minPanePx, containerWidth - minPanePx * (end ? 2 : 1))}
      disabled={!onStartWidthChange || mode !== 'columns'} tabindex={onStartWidthChange && mode === 'columns' ? 0 : -1}
      step={8} shiftStep={32} onSizeChange={(size) => onStartWidthChange?.(size)}
      aria-controls={`${id}-start`} data-tint-split-handle="start" />
    <div bind:this={middlePane} id={`${id}-middle`} data-tint-split-pane-middle="" class="pane">{@render middle()}</div>
    {#if end}
      <ResizeHandle label="Resize middle pane" size={Math.round(middleMeasured)} minSize={minPanePx}
        maxSize={Math.max(minPanePx, containerWidth - minPanePx * 2)}
        disabled={!onMiddleWidthChange || mode !== 'columns'} tabindex={onMiddleWidthChange && mode === 'columns' ? 0 : -1}
        step={8} shiftStep={32} onSizeChange={(size) => onMiddleWidthChange?.(size)}
        aria-controls={`${id}-middle`} data-tint-split-handle="middle" />
      <div data-tint-split-pane-end="" class="pane">{@render end()}</div>
    {/if}
  </div>
</div>

<style>
  .split-pane { container-type: inline-size; min-width: 0; min-height: 0; overflow: hidden; }
  .split-grid { display: grid; min-width: 0; min-height: 0; grid-template-columns: var(--split-columns); }
  .pane { min-width: 0; min-height: 0; overflow: auto; }
  .split-grid :global([data-tint-split-handle]) { width: 6px; min-width: 6px; border: 0; border-radius: 0; background: color-mix(in srgb, var(--tint-border) 60%, transparent); cursor: col-resize; touch-action: none; }
  .split-grid :global([data-tint-split-handle]):hover, .split-grid :global([data-tint-split-handle]):focus-visible { background: var(--tint-accent); }
  .split-grid :global([data-tint-split-handle]):focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 0; }
  @container (max-width: 899px) { [data-panes='3'] .split-grid { grid-template-columns: minmax(0, 1fr); } [data-panes='3'] .split-grid :global([data-tint-split-handle]) { display: none; } }
  @container (max-width: 599px) { [data-panes='2'] .split-grid { grid-template-columns: minmax(0, 1fr); } [data-panes='2'] .split-grid :global([data-tint-split-handle]) { display: none; } }
</style>
