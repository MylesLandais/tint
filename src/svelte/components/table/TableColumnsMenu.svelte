<script lang="ts" generics="TRow">
  import { tick } from 'svelte'
  import type { TableColumn } from './types'

  type Props<TRow> = {
    columns: readonly TableColumn<TRow>[]
    hiddenColumns: readonly string[]
    onChange: (hidden: readonly string[]) => void
    label?: string
    class?: string
  }

  let { columns, hiddenColumns, onChange, label = 'Columns', class: className }: Props<TRow> = $props()
  let open = $state(false)
  let container = $state<HTMLDivElement | null>(null)
  const menuId = $props.id()
  let hiddenSet = $derived(new Set(hiddenColumns))
  let hideable = $derived(columns.filter((column) => column.hideable !== false))
  let visibleCount = $derived(columns.filter((column) => !hiddenSet.has(column.id)).length)

  function columnName(column: TableColumn<TRow>): string {
    if (column.label) return column.label
    if (typeof column.header === 'string') return column.header
    return column.id
  }

  function toggle(id: string) {
    const next = hiddenSet.has(id)
      ? hiddenColumns.filter((candidate) => candidate !== id)
      : [...hiddenColumns, id]
    if (next.length < columns.length) onChange(next)
  }

  async function toggleOpen() {
    open = !open
    if (open) {
      await tick()
      container?.querySelector<HTMLElement>('[role="menuitemcheckbox"]')?.focus()
    }
  }

  function onMenuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { open = false; container?.querySelector('button')?.focus(); return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = [...(container?.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]:not(:disabled)') ?? [])]
    if (!items.length) return
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowDown' ? (current + 1) % items.length
      : (current - 1 + items.length) % items.length
    items[next]?.focus()
  }

  $effect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!container?.contains(event.target as Node)) open = false
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  })
</script>

<div bind:this={container} data-table-columns-menu="" class={className}>
  <button type="button" class="trigger" onclick={toggleOpen} aria-expanded={open} aria-haspopup="menu" aria-controls={open ? menuId : undefined}>
    {label}{hiddenSet.size ? ` · ${hiddenSet.size} hidden` : ''}
  </button>
  {#if open}
    <div id={menuId} role="menu" tabindex="-1" aria-label={label} class="menu" onkeydown={onMenuKeydown}>
      {#each hideable as column (column.id)}
        {@const isHidden = hiddenSet.has(column.id)}
        <button type="button" role="menuitemcheckbox" aria-checked={!isHidden} disabled={!isHidden && visibleCount <= 1} onclick={() => toggle(column.id)}>
          <span aria-hidden="true">{isHidden ? '○' : '●'}</span>{columnName(column)}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  [data-table-columns-menu] { position: relative; }
  button { color: var(--tint-ink); cursor: pointer; font: inherit; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  .trigger { min-height: 2.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); font-size: var(--tint-font-size-xs); }
  .trigger:hover { background: var(--tint-surface); }
  .menu { position: absolute; right: 0; z-index: 30; min-width: 13rem; margin-top: 0.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); padding: var(--tint-space-1); box-shadow: 0 1rem 3rem var(--tint-shadow-color); }
  .menu button { display: flex; width: 100%; align-items: center; gap: var(--tint-space-2); border: 0; border-radius: var(--tint-radius-sm); background: transparent; padding: var(--tint-space-1) var(--tint-space-2); text-align: left; font-size: var(--tint-font-size-xs); }
  .menu button:hover:not(:disabled) { background: var(--tint-surface); }
  .menu button:disabled { cursor: not-allowed; opacity: 0.5; }
  .menu span { color: var(--tint-accent); }
</style>
