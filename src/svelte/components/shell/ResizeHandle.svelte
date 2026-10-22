<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { clampSplitSize, keyboardSplitSize, pointerSplitSize, type WorkspaceSplitDirection, type WorkspaceSplitPrimary } from '../../../core/shell/layout'

  type Props = Omit<HTMLButtonAttributes, 'children' | 'value' | 'aria-label'> & {
    label: string
    size: number
    minSize?: number
    maxSize?: number
    direction?: WorkspaceSplitDirection
    primary?: WorkspaceSplitPrimary
    step?: number
    shiftStep?: number
    onSizeChange: (size: number) => void
  }
  let {
    label, size, minSize = 0, maxSize = 1000, direction = 'horizontal', primary = 'first',
    step = 10, shiftStep = 50, onSizeChange, disabled = false, class: className, ...rest
  }: Props = $props()
  let separator = $state<HTMLButtonElement | null>(null)
  let drag: { pointer: number; start: number; size: number } | null = null
  let current = $derived(clampSplitSize(size, minSize, maxSize))
  let horizontal = $derived(direction === 'horizontal')

  function pointerDown(event: PointerEvent) {
    if (disabled || event.button !== 0 || drag) return
    event.preventDefault()
    separator?.focus()
    separator?.setPointerCapture(event.pointerId)
    drag = { pointer: event.pointerId, start: horizontal ? event.clientX : event.clientY, size: current }
  }
  function pointerMove(event: PointerEvent) {
    if (disabled || !drag || drag.pointer !== event.pointerId) return
    onSizeChange(pointerSplitSize(drag.size, (horizontal ? event.clientX : event.clientY) - drag.start, primary, minSize, maxSize))
  }
  function pointerEnd(event: PointerEvent) {
    if (drag?.pointer !== event.pointerId) return
    drag = null
    if (separator?.hasPointerCapture(event.pointerId)) separator.releasePointerCapture(event.pointerId)
  }
  function keydown(event: KeyboardEvent) {
    if (disabled) return
    const next = keyboardSplitSize(current, event.key, event.shiftKey, direction, primary, minSize, maxSize, { step, shiftStep })
    if (next === null) return
    event.preventDefault()
    onSizeChange(next)
  }
</script>

<!-- A movable ARIA separator is keyboard reachable and reports the controlled size. -->
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<button {...rest} type="button" bind:this={separator} role="separator" aria-label={label}
  aria-orientation={horizontal ? 'vertical' : 'horizontal'} aria-valuemin={minSize}
  aria-valuemax={maxSize} aria-valuenow={current} aria-valuetext={`${current} pixels`}
  {disabled} data-tint-resize-handle class={className}
  onpointerdown={pointerDown} onpointermove={pointerMove} onpointerup={pointerEnd}
  onpointercancel={pointerEnd} onlostpointercapture={() => { drag = null }} onkeydown={keydown}></button>

<style>
  button { min-width: 5px; min-height: 5px; border: 0; padding: 0; background: var(--tint-border); cursor: col-resize; touch-action: none; user-select: none; }
  button[aria-orientation='horizontal'] { cursor: row-resize; }
  button:hover, button:focus-visible { background: var(--tint-accent); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 0; }
  button:disabled { cursor: default; opacity: .5; }
</style>
