<script lang="ts">
  import type { OAuthOption } from './types'
  type Props = { providers: readonly OAuthOption[]; ariaLabel: string; class?: string }
  let { providers, ariaLabel, class: className }: Props = $props()
</script>

{#if providers.length}
  <nav class={['tint-auth-oauth', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
    {#each providers as provider (provider.id)}
      <a href={provider.href}>
        {@render provider.icon?.()}
        <span>{provider.label}</span>
      </a>
    {/each}
  </nav>
{/if}

<style>
  .tint-auth-oauth { display: grid; gap: var(--tint-space-2); }
  a { display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; gap: var(--tint-space-2); border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: var(--tint-space-2) var(--tint-space-3); background: var(--tint-panel); color: var(--tint-ink); text-decoration: none; }
  a:hover { background: var(--tint-surface); }
  a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
