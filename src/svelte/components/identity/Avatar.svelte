<script lang="ts">
  import { identityInitials } from '../../../core/identity'
  import type { AvatarProps } from './types'

  let {
    identity, name, src, alt, size = 'md', presence, badge, decorative = false,
    class: className, ...rest
  }: AvatarProps = $props()
  let resolvedName = $derived(name ?? identity?.name ?? '')
  let resolvedSrc = $derived(src ?? identity?.avatarUrl)
  let resolvedPresence = $derived(presence ?? identity?.presence)
  let failedSource = $state<string | null>(null)
  let showImage = $derived(Boolean(resolvedSrc) && failedSource !== resolvedSrc)
  let accessibleName = $derived([
    (alt ?? resolvedName) || 'Unknown identity',
    resolvedPresence && resolvedPresence !== 'unknown' ? resolvedPresence : null,
  ].filter(Boolean).join(', '))

  $effect(() => {
    void resolvedSrc
    failedSource = null
  })
</script>

<span
  {...rest} data-tint-avatar="" data-size={size} data-presence={resolvedPresence}
  role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : accessibleName}
  aria-hidden={decorative || undefined}
  class={['avatar', className].filter(Boolean).join(' ')}
>
  {#if showImage}
    <img src={resolvedSrc} alt="" onerror={() => failedSource = resolvedSrc ?? null} />
  {:else}
    <span aria-hidden="true">{identityInitials(resolvedName)}</span>
  {/if}
  {#if resolvedPresence && resolvedPresence !== 'unknown'}
    <span data-avatar-presence="" data-presence={resolvedPresence} title={resolvedPresence} aria-hidden="true" class="presence"></span>
  {/if}
  {#if badge}<span class="badge">{@render badge()}</span>{/if}
</span>

<style>
  .avatar { position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; overflow: visible; border-radius: 50%; background: var(--tint-accent-soft); color: var(--tint-accent); font-weight: 600; }
  .avatar[data-size='xs'] { width: 1.25rem; height: 1.25rem; font-size: 0.5625rem; }
  .avatar[data-size='sm'] { width: 1.75rem; height: 1.75rem; font-size: 0.625rem; }
  .avatar[data-size='md'] { width: 2.25rem; height: 2.25rem; font-size: var(--tint-font-size-xs); }
  .avatar[data-size='lg'] { width: 3rem; height: 3rem; font-size: var(--tint-font-size-sm); }
  .avatar[data-size='xl'] { width: 4rem; height: 4rem; font-size: var(--tint-font-size-lg); }
  img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
  .presence { position: absolute; right: 0; bottom: 0; width: max(28%, 0.5rem); height: max(28%, 0.5rem); border: 2px solid var(--tint-panel); border-radius: 50%; background: var(--tint-muted); }
  .presence[data-presence='online'] { background: var(--tint-success); }
  .presence[data-presence='away'] { border-radius: 2px; background: var(--tint-warning); }
  .presence[data-presence='busy'] { transform: rotate(45deg); border-radius: 1px; background: var(--tint-danger); }
  .badge { position: absolute; top: -0.25rem; right: -0.25rem; }
</style>
