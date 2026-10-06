<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { NavGroup, NavRailItem } from './types'

  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    groups: readonly NavGroup[]
    activeId?: string
    collapsed?: boolean
    onCollapsedChange?: (collapsed: boolean) => void
    onNavigate?: (id: string, href: string) => void
    onLinkClick?: (event: MouseEvent, item: NavRailItem) => void
    header?: Snippet
    /**
     * A contextual view (for example a page's thread list) shown in place of
     * the groups while present. The host supplies its own way back.
     */
    context?: Snippet
    footer?: Snippet
  }
  let {
    groups, activeId, collapsed = false, onCollapsedChange, onNavigate, onLinkClick,
    header, context, footer, class: className, 'aria-label': ariaLabel = 'Primary navigation', ...rest
  }: Props = $props()

  function clickItem(event: MouseEvent, item: NavRailItem) {
    if (item.disabled) { event.preventDefault(); return }
    onNavigate?.(item.id, item.href)
    onLinkClick?.(event, item)
  }
</script>

<nav {...rest} aria-label={ariaLabel} data-tint-nav-rail data-collapsed={collapsed || undefined}
  class={['flex h-full w-full flex-col border-r border-tint-border bg-tint-panel p-2 @3xl/app-shell:w-64', collapsed && '@3xl/app-shell:w-16', className]}>
  {@render header?.()}
  {#if context && !collapsed}
  <div data-tint-nav-rail-context class="flex min-h-0 flex-1 flex-col overflow-hidden">{@render context()}</div>
  {:else}
  <div data-tint-nav-rail-groups class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
    {#each groups as group (group.id)}
      <section role="group" aria-label={group.label} data-tint-nav-group>
        {#if group.label}<h2 class={['mb-1 px-2 text-xs font-medium text-tint-muted', collapsed && 'sr-only']}>{group.label}</h2>{/if}
        <ul class="m-0 list-none space-y-1 p-0">
          {#each group.items as item (item.id)}
            <li>
              <a href={item.href} aria-current={item.id === activeId ? 'page' : undefined} aria-disabled={item.disabled || undefined}
                onclick={(event) => clickItem(event, item)}
                class={['flex min-h-11 items-center gap-3 rounded-lg px-3 text-tint-muted hover:bg-tint-surface hover:text-tint-ink',
                  collapsed && 'justify-center px-0', item.id === activeId && 'bg-tint-accent-soft text-tint-accent', item.disabled && 'opacity-50']}>
                <span aria-hidden="true">{#if item.icon}{@render item.icon()}{:else}<span class="text-xs font-semibold">{item.label.slice(0, 2)}</span>{/if}</span>
                <span class={['min-w-0 flex-1 truncate', collapsed && 'sr-only']}>{item.label}</span>
                {#if !collapsed}{@render item.badge?.()}{/if}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
  {/if}
  {@render footer?.()}
  {#if onCollapsedChange}
    <button type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}
      onclick={() => onCollapsedChange?.(!collapsed)}
      class="mt-2 flex min-h-9 items-center justify-center rounded-lg text-tint-muted hover:bg-tint-surface hover:text-tint-ink">
      <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
    </button>
  {/if}
</nav>
