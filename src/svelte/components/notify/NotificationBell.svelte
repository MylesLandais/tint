<script lang="ts">
  import { notificationBadgeCount } from '../../../core/notify'
  import Dialog from '../dialog/Dialog.svelte'
  import Panel from '../panel/Panel.svelte'
  import type { NotificationBellProps } from './types'

  let {
    unreadCount, open, onOpenChange, presentation = 'panel', title = 'Notifications',
    children, class: className, label = 'Notifications',
  }: NotificationBellProps = $props()
  const panelId = $props.id()
  let badge = $derived(notificationBadgeCount(unreadCount))
</script>

<div data-tint-notification-bell="" class={['notification-bell', className].filter(Boolean).join(' ')}>
  <div class="trigger-wrap">
    <button
      type="button" class="trigger" aria-label={unreadCount > 0 ? `${label}, ${unreadCount} unread` : label} aria-expanded={open}
      aria-controls={presentation === 'panel' ? panelId : undefined}
      onclick={() => onOpenChange(!open)}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
    </button>
    {#if badge}<span class="count">{badge}</span>{/if}
  </div>
  {#if presentation === 'dialog'}
    <Dialog {open} {onOpenChange} {title}>{@render children()}</Dialog>
  {:else}
    <div id={panelId} class="panel-wrap">
      <Panel {title} expanded={open} onExpandedChange={onOpenChange}>
        <div class="panel-body">{@render children()}</div>
      </Panel>
    </div>
  {/if}
</div>

<style>
  .notification-bell { position: relative; display: inline-flex; min-width: 0; max-width: 100%; flex-direction: column; gap: var(--tint-space-2); }
  .trigger-wrap { position: relative; display: inline-flex; align-self: flex-start; }
  .trigger { display: inline-flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); cursor: pointer; }
  .trigger:hover { background: var(--tint-accent-soft); }
  .trigger:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .count { position: absolute; top: -0.25rem; right: -0.25rem; display: inline-flex; min-width: 1rem; height: 1rem; align-items: center; justify-content: center; border-radius: 999px; background: var(--tint-accent); padding: 0 0.25rem; color: var(--tint-on-accent); font-size: 0.625rem; font-weight: 700; pointer-events: none; }
  .panel-wrap { width: 18rem; max-width: 100%; }
  .panel-body { padding: var(--tint-space-2); }
</style>
