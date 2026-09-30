<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import Button from '../button/Button.svelte'
  import Icon from '../icon/Icon.svelte'
  import { STATUS_GLYPHS } from '../icon/glyphs'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
    title: string
    description?: string
    icon?: Snippet
    action?: Snippet
    retryLabel?: string
    onRetry?: () => void
  }

  let { title, description, icon, action, retryLabel = 'Try again', onRetry, class: className, ...rest }: Props = $props()
</script>

<div {...rest} role="alert" data-tint-error-state="" class={['tint-state-view', className]}>
  <span class="icon" aria-hidden="true">{#if icon}{@render icon()}{:else}<Icon icon={STATUS_GLYPHS.error} size="lg" />{/if}</span>
  <h3>{title}</h3>
  {#if description}<p>{description}</p>{/if}
  {#if action}{@render action()}{:else if onRetry}<Button onclick={() => onRetry?.()}>{retryLabel}</Button>{/if}
</div>

<style>
  .tint-state-view { display: flex; flex-direction: column; align-items: center; gap: var(--tint-space-2); padding: var(--tint-space-6) var(--tint-space-4); text-align: center; }
  .icon { display: inline-flex; color: var(--tint-danger); }
  h3 { margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; }
  p { max-width: 28rem; margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
