<script lang="ts">
  import { onMount } from 'svelte'

  import type { RowAction } from './datasetTypes'

  type Props = {
    x: number
    y: number
    /** How many records the action applies to, for labels. */
    count: number
    readOnly?: boolean
    onAction: (action: RowAction) => void
    onClose: () => void
  }
  let { x, y, count, readOnly = false, onAction, onClose }: Props = $props()

  let root = $state<HTMLDivElement | null>(null)
  const noun = $derived(count > 1 ? `${count} records` : 'record')

  onMount(() => {
    root?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus()
    const away = (e: PointerEvent) => { if (root && !root.contains(e.target as Node)) onClose() }
    window.addEventListener('pointerdown', away, true)
    return () => window.removeEventListener('pointerdown', away, true)
  })

  function items() { return [...(root?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])] }
  function keydown(event: KeyboardEvent) {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'Tab') { event.preventDefault(); return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const list = items()
    const at = list.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1
      : event.key === 'ArrowDown' ? (at + 1) % list.length : (at <= 0 ? list.length - 1 : at - 1)
    list[next]?.focus()
  }
  const run = (action: RowAction) => { onAction(action); onClose() }
</script>

<div class="menu" bind:this={root} role="menu" aria-label="Record actions" tabindex="-1" style:left="{x}px" style:top="{y}px" onkeydown={keydown}>
  <button role="menuitem" type="button" disabled={readOnly} onclick={() => run('insert-above')}>Insert record above</button>
  <button role="menuitem" type="button" disabled={readOnly} onclick={() => run('insert-below')}>Insert record below</button>
  <button role="menuitem" type="button" disabled={readOnly} onclick={() => run('duplicate')}>Duplicate {noun}</button>
  <hr />
  <button role="menuitem" type="button" onclick={() => run('copy')}>Copy {noun}</button>
  <button role="menuitem" type="button" disabled={readOnly} onclick={() => run('clear')}>Clear {noun}</button>
  <hr />
  <button role="menuitem" type="button" class="danger" disabled={readOnly} onclick={() => run('delete')}>Delete {noun}</button>
</div>

<style>
  .menu {
    position: absolute; z-index: 50; min-width: 13rem; display: grid; padding: .25rem; background: var(--tint-panel); color: var(--tint-ink);
    border: 1px solid var(--tint-muted); border-radius: var(--tint-radius-md); font-size: var(--tint-font-size-sm);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--tint-shadow-color, #000) 24%, transparent);
  }
  button { font: inherit; text-align: start; color: inherit; background: none; border: 0; padding: .375rem .625rem; border-radius: var(--tint-radius-sm); cursor: pointer; }
  button:hover:not(:disabled), button:focus-visible { background: var(--tint-selection); outline: none; }
  button:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: -2px; }
  button:disabled { color: var(--tint-muted); cursor: not-allowed; }
  .danger:not(:disabled) { color: var(--tint-danger-ink); }
  hr { border: 0; border-top: 1px solid var(--tint-border); margin: .25rem 0; width: 100%; }
</style>
