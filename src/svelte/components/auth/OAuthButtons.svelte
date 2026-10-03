<script lang="ts">
  import { isKnownProvider } from '../../../core/auth/providers'
  import Badge from '../badge/Badge.svelte'
  import ProviderMark from './ProviderMark.svelte'
  import type { OAuthOption } from './types'

  type Props = {
    providers: readonly OAuthOption[]
    ariaLabel: string
    /** `stack` gives each provider a full-width row; `row` shares one line, as two or three compact buttons. */
    layout?: 'stack' | 'row'
    /** Provider id (or `AuthSnapshot.lastUsedMethod`) to mark. Ids that match no provider mark nothing. */
    lastUsed?: string | null
    lastUsedLabel?: string
    /** Intercept a choice, for example to open a popup instead of navigating. Call `event.preventDefault()` to stop the link. */
    onSelect?: (provider: OAuthOption, event: MouseEvent) => void
    class?: string
  }
  let {
    providers, ariaLabel, layout = 'stack', lastUsed = null, lastUsedLabel = 'Last used',
    onSelect, class: className,
  }: Props = $props()
</script>

{#if providers.length}
  <nav class={['tint-auth-oauth', className].filter(Boolean).join(' ')} aria-label={ariaLabel} data-layout={layout}>
    {#each providers as provider (provider.id)}
      <a
        href={provider.href}
        data-provider={provider.id}
        data-last-used={provider.id === lastUsed || undefined}
        onclick={onSelect ? (event) => onSelect(provider, event) : undefined}
      >
        {#if provider.icon}{@render provider.icon()}{:else if isKnownProvider(provider.id)}<ProviderMark provider={provider.id} />{/if}
        <span>{provider.label}</span>
        {#if provider.id === lastUsed}<Badge tone="info" class="tint-auth-last-used">{lastUsedLabel}</Badge>{/if}
      </a>
    {/each}
  </nav>
{/if}

<style>
  .tint-auth-oauth { display: grid; gap: var(--tint-space-2); }
  .tint-auth-oauth[data-layout='row'] { grid-template-columns: repeat(auto-fit, minmax(min(100%, 5.5rem), 1fr)); }
  a { position: relative; display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; gap: var(--tint-space-2); border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: var(--tint-space-2) var(--tint-space-3); background: var(--tint-panel); color: var(--tint-ink); font-weight: 600; text-decoration: none; }
  a:hover { background: var(--tint-surface); }
  a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  a[data-last-used] { border-color: var(--tint-accent); box-shadow: 0 0 0 1px var(--tint-accent); }
  /* The badge sits on the top-right edge, but stays in the link's text so it is part of the accessible name. */
  a :global(.tint-auth-last-used) { position: absolute; top: 0; right: var(--tint-space-2); transform: translateY(-50%); font-size: var(--tint-font-size-xs); font-weight: 500; white-space: nowrap; pointer-events: none; }
</style>
