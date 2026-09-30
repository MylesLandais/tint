<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements'
  import { filterCommands, nextCommandIndex } from '../../../core/shell/navigation'
  import type { CommandPaletteItem } from './types'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    open: boolean
    onOpenChange: (open: boolean) => void
    query: string
    onQueryChange: (query: string) => void
    items: readonly CommandPaletteItem[]
    onSelect?: (id: string) => void
    label?: string
    placeholder?: string
    emptyText?: string | Snippet
    inputProps?: Omit<HTMLInputAttributes, 'value' | 'oninput' | 'children'>
  }
  let { open, onOpenChange, query, onQueryChange, items, onSelect,
    label = 'Command palette', placeholder = 'Type a command…', emptyText = 'No commands found.',
    inputProps, class: className, ...rest }: Props = $props()
  const listId = $props.id()
  let input = $state<HTMLInputElement | null>(null)
  let dialog = $state<HTMLDivElement | null>(null)
  let active = $state(0)
  let filtered = $derived(filterCommands(items, query))
  let activeIndex = $derived(filtered[active] && !filtered[active].disabled ? active : nextCommandIndex(filtered, -1, 'Home'))

  function choose(item: CommandPaletteItem) {
    if (item.disabled) return
    onSelect?.(item.id)
    onOpenChange(false)
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); onOpenChange(false); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      active = nextCommandIndex(filtered, activeIndex, event.key)
      return
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      choose(filtered[activeIndex])
    }
  }

  function trapTab(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); onOpenChange(false); return }
    if (event.key !== 'Tab') return
    const focusable = [...(dialog?.querySelectorAll<HTMLElement>('input,button:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [])]
    if (!focusable.length) return
    const index = focusable.indexOf(document.activeElement as HTMLElement)
    if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus() }
    else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0].focus() }
  }

  $effect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    queueMicrotask(() => input?.focus())
    return () => queueMicrotask(() => previous?.focus())
  })
</script>

{#if open}
  <div {...rest} data-tint-command-palette class={['fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]', className]}>
    <button type="button" tabindex="-1" aria-label={`Close ${label}`} onclick={() => onOpenChange(false)}
      data-tint-command-palette-backdrop class="absolute inset-0 bg-tint-ink/30"></button>
    <div bind:this={dialog} role="dialog" aria-modal="true" aria-label={label} tabindex="-1" onkeydown={trapTab}
      class="relative w-full max-w-lg overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-xl">
      <div class="flex items-center gap-2 border-b border-tint-border px-4 py-3">
        <span aria-hidden="true" class="text-tint-muted">⌕</span>
        <input {...inputProps} bind:this={input} role="combobox" aria-label={inputProps?.['aria-label'] ?? label} aria-expanded="true" aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${filtered[activeIndex]?.id}` : undefined}
          value={query} oninput={(event) => { active = 0; onQueryChange(event.currentTarget.value) }} onkeydown={keydown}
          {placeholder} class={['tint-command-palette-input w-full bg-transparent text-sm placeholder:text-tint-muted', inputProps?.class]} />
      </div>
      <div id={listId} role="listbox" aria-label={label} class="max-h-80 overflow-auto p-2">
        {#if filtered.length}
          {#each filtered as item, index (item.id)}
            <button type="button" id={`${listId}-${item.id}`} role="option" aria-selected={index === activeIndex} disabled={item.disabled}
              onmouseenter={() => { if (!item.disabled) active = index }} onclick={() => choose(item)}
              class={['flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-tint-surface', index === activeIndex && 'bg-tint-accent-soft']}>
              <span class="min-w-0 flex-1"><span class="block text-sm font-medium">{item.label}</span>
                {#if item.description}<span class="block truncate text-xs text-tint-muted">{item.description}</span>{/if}
              </span>
              {#if item.shortcut}<kbd class="text-xs text-tint-muted">{item.shortcut}</kbd>{/if}
            </button>
          {/each}
        {:else}
          <div class="px-3 py-8 text-center text-sm text-tint-muted">
            {#if typeof emptyText === 'string'}{emptyText}{:else}{@render emptyText()}{/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .tint-command-palette-input:focus-visible {
    outline: var(--tint-focus-width) solid var(--tint-focus);
    outline-offset: var(--tint-focus-offset);
  }
</style>
