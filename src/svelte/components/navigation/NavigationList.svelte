<script lang="ts">
  import { navigationEntries } from '../../../core/navigation'
  import type { NavigationListProps } from './types'

  let {
    items, activeHref, label = 'Primary navigation', renderLink, onNavigate,
    class: className, ...rest
  }: NavigationListProps = $props()
  let entries = $derived(navigationEntries(items, activeHref))

  function navigate(event: MouseEvent, item: (typeof items)[number]) {
    if (item.disabled) {
      event.preventDefault()
      return
    }
    onNavigate?.(item)
  }
</script>

<nav {...rest} aria-label={label} class={className} data-tint-navigation-list="">
  <ul>
    {#each entries as { item, active } (item.id)}
      <li>
        {#snippet content()}
          {#if item.icon}<span class="icon" aria-hidden="true">{#if typeof item.icon === 'string'}{item.icon}{:else}{@render item.icon()}{/if}</span>{/if}
          <span class="label">{#if typeof item.label === 'string'}{item.label}{:else}{@render item.label()}{/if}</span>
          {#if item.badge}<span class="badge">{#if typeof item.badge === 'string'}{item.badge}{:else}{@render item.badge()}{/if}</span>{/if}
        {/snippet}
        {#if renderLink}
          {@render renderLink(item, content, active)}
        {:else}
          <a
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.disabled || undefined}
            data-active={active || undefined}
            data-disabled={item.disabled || undefined}
            onclick={(event) => navigate(event, item)}
          >{@render content()}</a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>

<style>
  ul { display: grid; gap: var(--tint-space-1); margin: 0; padding: 0; list-style: none; }
  li { min-width: 0; }
  a { display: flex; min-height: 2.5rem; align-items: center; gap: var(--tint-space-2); border-radius: var(--tint-radius-md); padding: var(--tint-space-2) var(--tint-space-3); color: var(--tint-muted); font-size: var(--tint-font-size-sm); text-decoration: none; transition: background-color var(--tint-motion-base) var(--tint-ease), color var(--tint-motion-base) var(--tint-ease); }
  a:hover { background: var(--tint-surface); color: var(--tint-ink); }
  a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  a[data-active] { background: var(--tint-accent-soft); color: var(--tint-accent); font-weight: 500; }
  a[data-disabled] { opacity: 0.5; cursor: not-allowed; }
  .icon, .badge { flex: none; }
  .label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { a { transition: none; } }
</style>
