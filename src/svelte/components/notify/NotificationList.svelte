<script lang="ts">
  import { groupNotifications, notificationActions } from '../../../core/notify'
  import Badge from '../badge/Badge.svelte'
  import Avatar from '../identity/Avatar.svelte'
  import type { NotificationListProps } from './types'

  let {
    notifications, groupBy = 'time', groupKey, onSelect, empty,
    class: className, ...rest
  }: NotificationListProps = $props()
  let groups = $derived(groupNotifications(notifications, groupBy, groupKey))
</script>

<div {...rest} data-tint-notification-list="" class={['notification-list', className].filter(Boolean).join(' ')}>
  {#if notifications.length === 0}
    <div class="empty">{#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{:else}No notifications.{/if}</div>
  {:else}
    {#each groups as group (group.key)}
      <section aria-label={group.key} class="group">
        <h3>{group.key}</h3>
        <ul>
          {#each group.notifications as notification (notification.id)}
            {@const actions = notificationActions(notification)}
            <li>
              <div data-tint-notification-row="" data-read={notification.read || undefined} data-tone={notification.tone} class="row">
                {#if notification.actor}
                  <Avatar identity={notification.actor} size="sm" decorative />
                {/if}
                <div class="content">
                  <div class="heading">
                    {#if onSelect}<button type="button" class="title action" onclick={() => onSelect?.(notification)}>{notification.title}</button>{:else}<p class="title">{notification.title}</p>{/if}
                    {#if !notification.read}<span class="unread-label">Unread</span>{/if}
                    <Badge tone="neutral">{notification.kind}</Badge>
                  </div>
                  {#if notification.subtitle}<p class="subtitle">{notification.subtitle}</p>{/if}
                  <p class="time"><time datetime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time></p>
                  {#if actions.length > 0}
                    <div class="actions">
                      {#each actions as action (action.id)}
                        {#if action.href}<a href={action.href}>{action.label}</a>{:else}<button type="button" onclick={() => action.onSelect?.()}>{action.label}</button>{/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>

<style>
  .notification-list { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-3); container-type: inline-size; }
  .empty { padding: var(--tint-space-4) var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .group { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-1); }
  h3 { margin: 0; padding: 0 var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  ul { margin: 0; padding: 0; list-style: none; }
  .row { display: flex; min-width: 0; gap: var(--tint-space-2); border-radius: var(--tint-radius-md); padding: var(--tint-space-2); text-align: left; }
  .row:not([data-read]) { background: color-mix(in srgb, var(--tint-accent-soft) 50%, transparent); }
  .content { min-width: 0; flex: 1; }
  .heading { display: flex; min-width: 0; flex-wrap: wrap; align-items: flex-start; gap: var(--tint-space-2); }
  .title { flex: 1; margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; }
  .unread-label { color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-weight: 600; }
  .title.action { border: 0; background: transparent; padding: 0; text-align: left; cursor: pointer; }
  .title.action:hover { text-decoration: underline; }
  .subtitle, .time { margin: var(--tint-space-1) 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .actions { display: flex; flex-wrap: wrap; gap: var(--tint-space-2); margin-top: var(--tint-space-1); font-size: var(--tint-font-size-xs); }
  .actions a, .actions button { border: 0; background: transparent; padding: 0; color: var(--tint-accent); font: inherit; text-decoration: none; cursor: pointer; }
  .actions a:hover, .actions button:hover { text-decoration: underline; }
  button:focus-visible, a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  @container (max-width: 280px) { .heading { flex-wrap: wrap; } }
</style>
