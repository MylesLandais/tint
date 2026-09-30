<script lang="ts">
  import Eraser from '@lucide/svelte/icons/eraser'
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import TerminalGlyph from '@lucide/svelte/icons/terminal'
  import { untrack } from 'svelte'
  import { TerminalController } from '../../../core/terminal/controller'
  import Icon from '../icon/Icon.svelte'
  import StatusIcon from '../icon/StatusIcon.svelte'
  import Panel from '../panel/Panel.svelte'
  import type { TerminalConsoleProps } from './types'

  const STATUS_LABEL = {
    connecting: 'Connecting', connected: 'Connected', disconnected: 'Disconnected', error: 'Error',
  } as const
  const STATUS_ICON = {
    connecting: 'loading', connected: 'success', disconnected: 'cancelled', error: 'error',
  } as const

  let {
    session, status, expanded, onExpandedChange, title = 'Terminal', statusMessage,
    onReconnect, onClear, label = 'Interactive terminal', options,
    class: className, bodyClassName, viewportClassName,
  }: TerminalConsoleProps = $props()
  let host = $state<HTMLDivElement | null>(null)
  let controller = $state<TerminalController | null>(null)

  $effect(() => {
    if (!host) return
    const mounted = new TerminalController(host, untrack(() => session), untrack(() => status), untrack(() => options))
    controller = mounted
    return () => {
      controller = null
      mounted.dispose()
    }
  })

  $effect(() => { controller?.setSession(session) })
  $effect(() => { controller?.setStatus(status) })
  $effect(() => {
    if (!expanded || !controller) return
    const frame = requestAnimationFrame(() => controller?.fit())
    return () => cancelAnimationFrame(frame)
  })

  function clear() {
    controller?.clear()
    onClear?.()
  }
</script>

{#snippet panelIcon()}<Icon icon={TerminalGlyph} size="sm" />{/snippet}
{#snippet panelStatus()}
  <span aria-live="polite" title={statusMessage} class="flex min-w-0 items-center gap-1.5">
    <StatusIcon status={STATUS_ICON[status]} size="xs" />
    <span class="truncate">{statusMessage || STATUS_LABEL[status]}</span>
  </span>
{/snippet}
{#snippet panelActions()}
  {#if (status === 'disconnected' || status === 'error') && onReconnect}
    <button type="button" aria-label="Reconnect terminal" title="Reconnect terminal" onclick={onReconnect}
      class="flex size-8 items-center justify-center rounded-md text-tint-muted outline-none transition hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:ring-2 focus-visible:ring-tint-accent">
      <Icon icon={RefreshCw} size="sm" />
    </button>
  {/if}
  <button type="button" aria-label="Clear terminal" title="Clear terminal" onclick={clear}
    class="flex size-8 items-center justify-center rounded-md text-tint-muted outline-none transition hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:ring-2 focus-visible:ring-tint-accent">
    <Icon icon={Eraser} size="sm" />
  </button>
{/snippet}

<Panel {title} {expanded} {onExpandedChange} icon={panelIcon} status={panelStatus} actions={panelActions} class={className}>
  <div data-terminal-body class={['bg-tint-code', bodyClassName]}>
    <div bind:this={host} role="application" aria-label={label} data-terminal-viewport=""
      class={['h-96 min-h-48 w-full bg-tint-code p-2', viewportClassName]}></div>
  </div>
</Panel>
