<script lang="ts">
  import { tick, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { flattenNavGroups } from '../../../core/shell/navigation'
  import type { NavGroup, NavRailItem } from './types'

  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    brand?: Snippet
    groups: readonly NavGroup[]
    activeId?: string
    onNavigate?: (id: string, href: string) => void
    maxVisibleItems?: number
    overflowLabel?: string
    actions?: Snippet
  }
  let { brand, groups, activeId, onNavigate, maxVisibleItems, overflowLabel = 'More', actions,
    class: className, ...rest }: Props = $props()
  let moreRoot = $state<HTMLDivElement | null>(null)
  let menu = $state<HTMLDivElement | null>(null)
  let moreButton = $state<HTMLButtonElement | null>(null)
  let open = $state(false)
  let flat = $derived(flattenNavGroups(groups))
  let visible = $derived(maxVisibleItems === undefined ? flat : flat.slice(0, Math.max(0, maxVisibleItems)))
  let overflow = $derived(maxVisibleItems === undefined ? [] : flat.slice(Math.max(0, maxVisibleItems)))

  function navigate(event: MouseEvent, item: NavRailItem) {
    if (item.disabled) { event.preventDefault(); return }
    const fromOverflow = event.currentTarget instanceof Element && Boolean(event.currentTarget.closest('[data-tint-top-nav-overflow]'))
    open = false
    onNavigate?.(item.id, item.href)
    if (fromOverflow) moreButton?.focus()
  }

  async function toggleMore() {
    open = !open
    if (open) {
      await tick()
      menu?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus()
    }
  }

  function menuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); open = false; moreButton?.focus(); return }
    if (event.key === 'Tab') { open = false; return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const links = [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])]
    if (!links.length) return
    event.preventDefault()
    const current = links.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
      : event.key === 'ArrowDown' ? (current + 1) % links.length : (current - 1 + links.length) % links.length
    links[next]?.focus()
  }

  $effect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!moreRoot?.contains(event.target as Node)) open = false }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { open = false; moreButton?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  })
</script>

<nav {...rest} data-tint-top-nav class={['flex min-h-12 items-center gap-1 border-b border-tint-border bg-tint-panel px-3', className]}>
  {#if brand}<div data-tint-top-nav-brand class="mr-2 flex shrink-0 items-center">{@render brand()}</div>{/if}
  <div data-tint-top-nav-items class="flex min-w-0 items-center gap-1">
    {#each visible as entry, index (entry.item.id)}
      {#if entry.divider && index > 0}<span aria-hidden="true" class="mx-1 h-5 w-px shrink-0 bg-tint-border"></span>{/if}
      <a href={entry.item.href} aria-current={entry.item.id === activeId ? 'page' : undefined} aria-disabled={entry.item.disabled || undefined}
        onclick={(event) => navigate(event, entry.item)}
        class={['flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-tint-muted hover:bg-tint-surface hover:text-tint-ink',
          entry.item.id === activeId && 'bg-tint-accent-soft text-tint-accent', entry.item.disabled && 'opacity-50']}>
        {#if entry.item.icon}<span aria-hidden="true">{@render entry.item.icon()}</span>{/if}
        <span class="min-w-0 flex-1 truncate">{entry.item.label}</span>
        {@render entry.item.badge?.()}
      </a>
    {/each}
    {#if overflow.length}
      <div bind:this={moreRoot} class="relative">
        <button bind:this={moreButton} type="button" aria-haspopup="menu" aria-expanded={open} onclick={toggleMore}
          class="flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm text-tint-muted hover:bg-tint-surface hover:text-tint-ink">
          {overflowLabel}<span aria-hidden="true">⌄</span>
        </button>
        {#if open}
          <div bind:this={menu} role="menu" aria-label={overflowLabel} data-tint-top-nav-overflow tabindex="-1" onkeydown={menuKeydown}
            class="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col gap-1 rounded-xl border border-tint-border bg-tint-panel p-2 shadow-xl">
            {#each overflow as entry, index (entry.item.id)}
              {#if entry.divider && index > 0}<span aria-hidden="true" class="h-px bg-tint-border"></span>{/if}
              <a href={entry.item.href} role="menuitem" tabindex="-1"
                aria-current={entry.item.id === activeId ? 'page' : undefined} aria-disabled={entry.item.disabled || undefined}
                onclick={(event) => navigate(event, entry.item)}
                class={['flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-tint-muted hover:bg-tint-surface hover:text-tint-ink',
                  entry.item.id === activeId && 'bg-tint-accent-soft text-tint-accent', entry.item.disabled && 'opacity-50']}>
                {#if entry.item.icon}<span aria-hidden="true">{@render entry.item.icon()}</span>{/if}
                <span class="min-w-0 flex-1 truncate">{entry.item.label}</span>
                {@render entry.item.badge?.()}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  {#if actions}<div data-tint-top-nav-actions class="ml-auto flex shrink-0 items-center gap-2">{@render actions()}</div>{/if}
</nav>

<style>
  a:focus-visible, button:focus-visible {
    outline: var(--tint-focus-width) solid var(--tint-focus);
    outline-offset: var(--tint-focus-offset);
  }
</style>
