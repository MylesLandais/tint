<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { clampSplitSize, keyboardSplitSize, pointerSplitSize, type WorkspaceSplitDirection, type WorkspaceSplitPrimary } from '../../../core/shell/layout'

  let { size, minSize = 0, maxSize = 1000, direction = 'horizontal', primary = 'first', label, controls,
    onSizeChange, class: className, style, ...rest }: Omit<HTMLButtonAttributes, 'children' | 'onchange'> & {
    size: number; minSize?: number; maxSize?: number; direction?: WorkspaceSplitDirection;
    primary?: WorkspaceSplitPrimary; label: string; controls?: string; onSizeChange: (size: number) => void;
  } = $props()
  let handle = $state<HTMLButtonElement | null>(null)
  let drag: { pointer: number; start: number; size: number } | null = null
  const current = $derived(clampSplitSize(size, minSize, maxSize))
  const horizontal = $derived(direction === 'horizontal')
  function start(event: PointerEvent) {
    if (event.button !== 0 || drag) return
    event.preventDefault(); handle?.focus(); handle?.setPointerCapture(event.pointerId)
    drag = { pointer: event.pointerId, start: horizontal ? event.clientX : event.clientY, size: current }
  }
  function move(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return
    onSizeChange(pointerSplitSize(drag.size, (horizontal ? event.clientX : event.clientY) - drag.start, primary, minSize, maxSize))
  }
  function end(event: PointerEvent) {
    if (drag?.pointer !== event.pointerId) return
    drag = null
    if (handle?.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  }
  function keydown(event: KeyboardEvent) {
    const next = keyboardSplitSize(current, event.key, event.shiftKey, direction, primary, minSize, maxSize)
    if (next === null) return
    event.preventDefault(); onSizeChange(next)
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<button {...rest} bind:this={handle} type="button" role="separator" aria-label={label} aria-controls={controls}
  aria-orientation={horizontal ? 'vertical' : 'horizontal'} aria-valuemin={minSize} aria-valuemax={maxSize}
  aria-valuenow={current} aria-valuetext={`${current} pixels`} data-tint-workspace-separator
  class={['border-0 p-0 hover:bg-tint-accent/40 focus-visible:bg-tint-accent/40 focus-visible:outline focus-visible:outline-tint-focus', horizontal ? 'cursor-col-resize' : 'cursor-row-resize', className]}
  style={`touch-action:none;user-select:none;${style ?? ''}`}
  onpointerdown={start} onpointermove={move} onpointerup={end} onpointercancel={end}
  onlostpointercapture={() => { drag = null }} onkeydown={keydown}></button>
