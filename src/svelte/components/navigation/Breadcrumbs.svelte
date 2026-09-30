<script lang="ts">
  import { breadcrumbEntries } from '../../../core/navigation'
  import type { BreadcrumbsProps } from './types'

  let { items, label = 'Breadcrumb', renderLink, class: className, ...rest }: BreadcrumbsProps = $props()
  let entries = $derived(breadcrumbEntries(items))
</script>

<nav {...rest} aria-label={label} class={className} data-tint-breadcrumbs="">
  <ol>
    {#each entries as { item, current, linked }, index (item.id)}
      <li>
        {#if index > 0}<span class="separator" aria-hidden="true">/</span>{/if}
        {#snippet content()}
          <span aria-current={current ? 'page' : undefined}>{#if typeof item.label === 'string'}{item.label}{:else}{@render item.label()}{/if}</span>
        {/snippet}
        {#if linked && item.href}
          {#if renderLink}{@render renderLink(item, content)}{:else}<a href={item.href}>{@render content()}</a>{/if}
        {:else}
          {@render content()}
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  ol { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-1); margin: 0; padding: 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); list-style: none; }
  li { display: flex; min-width: 0; align-items: center; gap: var(--tint-space-1); }
  .separator { color: var(--tint-muted); }
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--tint-accent); text-decoration: underline; }
  a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  [aria-current='page'] { color: var(--tint-ink); font-weight: 500; }
</style>
