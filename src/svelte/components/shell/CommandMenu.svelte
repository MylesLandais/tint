<script lang="ts">
  import { onDestroy, tick, type Snippet } from 'svelte'
  import { Command } from '@lucide/svelte'
  import { filterCommands, commandOptionId } from '../../../core/shell/navigation'
  import type { CommandPaletteItem } from './types'

  type Props = {
    id: string
    items: readonly CommandPaletteItem[]
    query: string
    activeId?: string
    onSelect: (id: string) => void
    onActiveChange?: (id: string) => void
    label?: string
    emptyText?: string | Snippet
    /** Keep focus and keyboard input in the controlling composer/editor. */
    preserveInputFocus?: boolean
    /** False retains source order without grouping headings. Defaults to true. */
    grouped?: boolean
    /** Override the decorative icon, or hide it with false. */
    icon?: Snippet<[item: CommandPaletteItem]> | false
    class?: string
  }
  let { id, items, query, activeId, onSelect, onActiveChange,
    label = 'Commands', emptyText = 'No commands found.', preserveInputFocus = false, grouped = true, icon, class: className }: Props = $props()
  let filtered = $derived(filterCommands(items, query))
  let groups = $derived(grouped ? [...new Set(filtered.map((item) => item.group ?? 'Commands'))] : ['Commands'])
  let node = $state<HTMLDivElement>()
  let alive = true
  onDestroy(() => { alive = false })

  function choose(id: string) {
    if (alive && filtered.some((item) => item.id === id && !item.disabled)) onSelect(id)
  }
  $effect(() => {
    const current = filtered.find((item) => item.id === activeId && !item.disabled)
    const root = node, optionId = current ? commandOptionId(id, current.id) : null
    let currentEffect = true
    void tick().then(() => {
      if (!alive || !currentEffect || node !== root || !optionId) return
      const option = document.getElementById(optionId)
      if (option && root?.contains(option)) option.scrollIntoView?.({ block: 'nearest' })
    })
    return () => { currentEffect = false }
  })
</script>

<div bind:this={node} {id} role="listbox" aria-label={label} data-tint-command-menu
  class={['max-h-80 overflow-y-auto rounded-2xl border border-tint-border bg-tint-panel p-2 shadow-xl', className]}>
  {#if filtered.length}
    {#each groups as group (group)}
      {#if grouped}<div role="presentation" class="px-3 pb-1 pt-2 text-xs font-medium text-tint-muted">{group}</div>{/if}
      {#each filtered.filter((item) => !grouped || (item.group ?? 'Commands') === group) as item (item.id)}
        <button id={commandOptionId(id, item.id)} type="button" role="option" aria-selected={!item.disabled && item.id === activeId}
          disabled={item.disabled} tabindex={preserveInputFocus ? -1 : undefined}
          onmousedown={(event) => { if (preserveInputFocus) event.preventDefault() }}
          onmouseenter={() => { if (alive && !item.disabled) onActiveChange?.(item.id) }}
          onclick={() => choose(item.id)}
          class={['flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-tint-surface',
            item.id === activeId && 'bg-tint-accent-soft']}>
          {#if icon !== false}<span aria-hidden="true" class="shrink-0 text-tint-muted">{#if icon}{@render icon(item)}{:else}<Command size={20} />{/if}</span>{/if}
          <span class="min-w-0 flex-1"><span class="block text-sm font-medium">{item.label}</span>
            {#if item.description}<span class="block truncate text-xs text-tint-muted">{item.description}</span>{/if}</span>
          {#if item.shortcut}<kbd class="shrink-0 text-xs text-tint-muted">{item.shortcut}</kbd>{/if}
        </button>
      {/each}
    {/each}
  {:else}
    <div class="px-3 py-6 text-center text-sm text-tint-muted">{#if typeof emptyText === 'string'}{emptyText}{:else}{@render emptyText()}{/if}</div>
  {/if}
</div>
