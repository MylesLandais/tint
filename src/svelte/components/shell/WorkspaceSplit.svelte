<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { clampSplitSize, keyboardSplitSize, pointerSplitSize, splitTracks, type WorkspaceSplitDirection, type WorkspaceSplitPrimary } from '../../../core/shell/layout'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    direction?: WorkspaceSplitDirection
    primary?: WorkspaceSplitPrimary
    size: number
    minSize?: number
    maxSize?: number
    onSizeChange: (size: number) => void
    label: string
    first: Snippet
    second: Snippet
  }
  let {
    direction = 'horizontal', primary = 'first', size, minSize = 0, maxSize = 1000,
    onSizeChange, label, first, second, class: className, style, ...rest
  }: Props = $props()
  const id = $props.id()
  let separator = $state<HTMLButtonElement | null>(null)
  let drag: { pointer: number; start: number; size: number } | null = null
  let current = $derived(clampSplitSize(size, minSize, maxSize))
  let horizontal = $derived(direction === 'horizontal')
  let gridStyle = $derived(`${style ?? ''}; display: grid; min-width: 0; min-height: 0; ${horizontal ? 'grid-template-columns' : 'grid-template-rows'}: ${splitTracks(current, primary)}`)

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || drag) return
    event.preventDefault()
    separator?.focus()
    separator?.setPointerCapture(event.pointerId)
    drag = { pointer: event.pointerId, start: horizontal ? event.clientX : event.clientY, size: current }
  }
  function pointerMove(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return
    onSizeChange(pointerSplitSize(drag.size, (horizontal ? event.clientX : event.clientY) - drag.start, primary, minSize, maxSize))
  }
  function pointerEnd(event: PointerEvent) {
    if (drag?.pointer !== event.pointerId) return
    drag = null
    if (separator?.hasPointerCapture(event.pointerId)) separator.releasePointerCapture(event.pointerId)
  }
  function keydown(event: KeyboardEvent) {
    const next = keyboardSplitSize(current, event.key, event.shiftKey, direction, primary, minSize, maxSize)
    if (next === null) return
    event.preventDefault()
    onSizeChange(next)
  }
</script>

<div {...rest} data-tint-workspace-split data-direction={direction} class={className} style={gridStyle}>
  <div id={`${id}-first`} data-tint-workspace-pane="first" style="display: grid; min-width: 0; min-height: 0; overflow: auto">{@render first()}</div>
  <!-- A movable ARIA separator is focusable and handles both pointer and keyboard input. -->
  <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
  <button type="button" bind:this={separator} role="separator" aria-label={label}
    aria-orientation={horizontal ? 'vertical' : 'horizontal'} aria-controls={`${id}-${primary}`}
    aria-valuemin={minSize} aria-valuemax={maxSize} aria-valuenow={current} aria-valuetext={`${current} pixels`}
    data-tint-workspace-separator
    class={['border-0 p-0 hover:bg-tint-accent/40 focus-visible:bg-tint-accent/40 focus-visible:outline focus-visible:outline-tint-accent', horizontal ? 'cursor-col-resize' : 'cursor-row-resize']}
    style="touch-action: none; user-select: none"
    onpointerdown={pointerDown} onpointermove={pointerMove} onpointerup={pointerEnd}
    onpointercancel={pointerEnd} onlostpointercapture={() => { drag = null }} onkeydown={keydown}></button>
  <div id={`${id}-second`} data-tint-workspace-pane="second" style="display: grid; min-width: 0; min-height: 0; overflow: auto">{@render second()}</div>
</div>
