<script lang="ts">
  import { Command } from '@lucide/svelte'
  import { filterCommands } from '../../../core/shell/navigation'
  import type { CommandPaletteItem } from './types'

  type Props = {
    id: string
    items: readonly CommandPaletteItem[]
    query: string
    activeId?: string
    onSelect: (id: string) => void
    onActiveChange?: (id: string) => void
    label?: string
    emptyText?: string
    class?: string
  }
  let { id, items, query, activeId, onSelect, onActiveChange,
    label = 'Commands', emptyText = 'No commands found.', class: className }: Props = $props()
  let filtered = $derived(filterCommands(items, query))
  let groups = $derived([...new Set(filtered.map((item) => item.group ?? 'Commands'))])

  function optionId(listId: string, commandId: string): string {
    return `${listId}-${commandId}`
  }
</script>

<div {id} role="listbox" aria-label={label} data-tint-command-menu
  class={['max-h-80 overflow-y-auto rounded-2xl border border-tint-border bg-tint-panel p-2 shadow-xl', className]}>
  {#if filtered.length}
    {#each groups as group (group)}
      <div role="presentation" class="px-3 pb-1 pt-2 text-xs font-medium text-tint-muted">{group}</div>
      {#each filtered.filter((item) => (item.group ?? 'Commands') === group) as item (item.id)}
        <button id={optionId(id, item.id)} type="button" role="option" aria-selected={item.id === activeId}
          disabled={item.disabled} onmouseenter={() => { if (!item.disabled) onActiveChange?.(item.id) }}
          onclick={() => onSelect(item.id)}
          class={['flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-tint-surface',
            item.id === activeId && 'bg-tint-accent-soft']}>
          <Command size={20} aria-hidden="true" class="shrink-0 text-tint-muted" />
          <span class="min-w-0 flex-1"><span class="block text-sm font-medium">{item.label}</span>
            {#if item.description}<span class="block truncate text-xs text-tint-muted">{item.description}</span>{/if}</span>
          {#if item.shortcut}<kbd class="shrink-0 text-xs text-tint-muted">{item.shortcut}</kbd>{/if}
        </button>
      {/each}
    {/each}
  {:else}
    <div class="px-3 py-6 text-center text-sm text-tint-muted">{emptyText}</div>
  {/if}
</div>
