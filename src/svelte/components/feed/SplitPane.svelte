<script lang="ts">
  import { resizedPaneWidth, splitPaneMode } from '../../../core/feed'
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

  function widthIntent(which: 'start' | 'middle', next: number) {
    if (which === 'start') onStartWidthChange?.(next)
    else onMiddleWidthChange?.(next)
  }

  function pointerDown(event: PointerEvent, which: 'start' | 'middle') {
    const callback = which === 'start' ? onStartWidthChange : onMiddleWidthChange
    const node = root
    const pane = which === 'start' ? startPane : middlePane
    if (!callback || !node || !pane || mode !== 'columns') return
    event.preventDefault()
    const startX = event.clientX
    const startW = pane.getBoundingClientRect().width
    const width = node.getBoundingClientRect().width
    const move = (next: PointerEvent) => widthIntent(which, resizedPaneWidth(startW, next.clientX - startX, width, minPanePx, Boolean(end)))
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  function resizeKey(event: KeyboardEvent, which: 'start' | 'middle') {
    const callback = which === 'start' ? onStartWidthChange : onMiddleWidthChange
    if (!callback || mode !== 'columns' || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    const current = which === 'start' ? startMeasured : middleMeasured
    const delta = (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 32 : 8)
    widthIntent(which, resizedPaneWidth(current, delta, containerWidth, minPanePx, Boolean(end)))
  }
</script>

<div {...rest} bind:this={root} data-tint-split-pane="" data-panes={end ? 3 : 2} data-layout={mode} class={['split-pane', className].filter(Boolean).join(' ')} style:--split-columns={columns}>
  <div class="split-grid">
    <div bind:this={startPane} id={`${id}-start`} data-tint-split-pane-start="" class="pane">{@render start()}</div>
    <!-- A focusable separator supports pointer drag and arrow-key resizing. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      role="separator" aria-orientation="vertical" aria-label="Resize start pane"
      aria-controls={`${id}-start`} aria-valuemin={minPanePx}
      aria-valuemax={Math.max(minPanePx, containerWidth - minPanePx * (end ? 2 : 1))}
      aria-valuenow={Math.max(minPanePx, Math.round(startMeasured))}
      tabindex={onStartWidthChange && mode === 'columns' ? 0 : -1}
      data-tint-split-handle="start" class="handle"
      onpointerdown={(event) => pointerDown(event, 'start')}
      onkeydown={(event) => resizeKey(event, 'start')}
    ></div>
    <div bind:this={middlePane} id={`${id}-middle`} data-tint-split-pane-middle="" class="pane">{@render middle()}</div>
    {#if end}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        role="separator" aria-orientation="vertical" aria-label="Resize middle pane"
        aria-controls={`${id}-middle`} aria-valuemin={minPanePx}
        aria-valuemax={Math.max(minPanePx, containerWidth - minPanePx * 2)}
        aria-valuenow={Math.max(minPanePx, Math.round(middleMeasured))}
        tabindex={onMiddleWidthChange && mode === 'columns' ? 0 : -1}
        data-tint-split-handle="middle" class="handle"
        onpointerdown={(event) => pointerDown(event, 'middle')}
        onkeydown={(event) => resizeKey(event, 'middle')}
      ></div>
      <div data-tint-split-pane-end="" class="pane">{@render end()}</div>
    {/if}
  </div>
</div>

<style>
  .split-pane { container-type: inline-size; min-width: 0; min-height: 0; overflow: hidden; }
  .split-grid { display: grid; min-width: 0; min-height: 0; grid-template-columns: var(--split-columns); }
  .pane { min-width: 0; min-height: 0; overflow: auto; }
  .handle { width: 6px; min-width: 6px; border: 0; border-radius: 0; background: color-mix(in srgb, var(--tint-border) 60%, transparent); cursor: col-resize; touch-action: none; }
  .handle:hover, .handle:focus-visible { background: var(--tint-accent); }
  .handle:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 0; }
  @container (max-width: 899px) { [data-panes='3'] .split-grid { grid-template-columns: minmax(0, 1fr); } [data-panes='3'] .handle { display: none; } }
  @container (max-width: 599px) { [data-panes='2'] .split-grid { grid-template-columns: minmax(0, 1fr); } [data-panes='2'] .handle { display: none; } }
</style>
