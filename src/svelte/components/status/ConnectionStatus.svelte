<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import type { ConnectionState } from '../../../client/types'
  import type { StatusName } from '../../../core/icon/status'
  import { DEFAULT_CONNECTION_LABELS } from '../../../core/status/model'
  import Button from '../button/Button.svelte'
  import StatusIcon from '../icon/StatusIcon.svelte'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    state: ConnectionState
    labels?: Partial<Record<ConnectionState, string>>
    onRetry?: () => void
  }

  let { state, labels, onRetry, class: className, ...rest }: Props = $props()
  let label = $derived(labels?.[state] ?? DEFAULT_CONNECTION_LABELS[state])
  let iconStatus = $derived<StatusName>(state === 'connecting' || state === 'reconnecting' ? 'loading' : state === 'online' ? 'success' : state === 'offline' || state === 'error' ? 'error' : 'idle')
</script>

<div {...rest} role="status" aria-live="polite" data-tint-connection-status="" data-state={state} class={['tint-connection-status', className]}>
  <StatusIcon status={iconStatus} size="sm" />
  <span>{label}</span>
  {#if onRetry && (state === 'offline' || state === 'error')}
    <Button size="sm" variant="ghost" onclick={() => onRetry?.()}>Retry</Button>
  {/if}
</div>

<style>
  .tint-connection-status { display: inline-flex; align-items: center; gap: var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
