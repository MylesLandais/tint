<script lang="ts">
  import { identityOverflow, visibleIdentities } from '../../../core/identity'
  import Avatar from './Avatar.svelte'
  import type { AvatarGroupProps } from './types'

  let { identities, max = 4, size = 'md', renderLink, class: className, ...rest }: AvatarGroupProps = $props()
  let visible = $derived(visibleIdentities(identities, max))
  let overflow = $derived(identityOverflow(identities, max))
</script>

<div {...rest} data-tint-avatar-group="" class={['avatar-group', className].filter(Boolean).join(' ')}>
  {#each visible as identity (identity.id)}
    {#snippet avatar()}<Avatar {identity} {size} />{/snippet}
    <span class="item">{#if renderLink}{@render renderLink(identity, avatar)}{:else}{@render avatar()}{/if}</span>
  {/each}
  {#if overflow > 0}<span class="overflow" data-size={size}>+{overflow}</span>{/if}
</div>

<style>
  .avatar-group { display: flex; align-items: center; }
  .item { display: inline-flex; margin-left: -0.5rem; border: 2px solid var(--tint-panel); border-radius: 50%; }
  .item:first-child { margin-left: 0; }
  .overflow { display: inline-flex; flex: none; align-items: center; justify-content: center; margin-left: -0.5rem; border: 2px solid var(--tint-panel); border-radius: 50%; background: var(--tint-surface); color: var(--tint-muted); font-weight: 500; }
  .overflow[data-size='xs'] { width: 1.25rem; height: 1.25rem; font-size: 0.5625rem; }
  .overflow[data-size='sm'] { width: 1.75rem; height: 1.75rem; font-size: 0.625rem; }
  .overflow[data-size='md'] { width: 2.25rem; height: 2.25rem; font-size: var(--tint-font-size-xs); }
  .overflow[data-size='lg'] { width: 3rem; height: 3rem; font-size: var(--tint-font-size-sm); }
  .overflow[data-size='xl'] { width: 4rem; height: 4rem; font-size: var(--tint-font-size-lg); }
</style>
