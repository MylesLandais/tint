<script lang="ts">
  import { DEFAULT_NOTIFICATION_SETTINGS, NotificationBell, NotificationList, NotificationSettingsPanel, type Notification, type NotificationSettings } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let notifications = $state<Notification[]>([
    { id: 'ready', kind: 'artifact_ready', title: 'Night Drive mix is ready', subtitle: 'A new artifact is available.', createdAt: '2026-09-30T10:00:00Z', read: false, tone: 'success' },
    { id: 'source', kind: 'source_health', title: 'Community source is unreachable', createdAt: '2026-09-29T14:00:00Z', read: false, tone: 'warning' },
  ])
  let settings = $state<NotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })
  let bellOpen = $state(false)
  let unreadCount = $derived(notifications.filter((notification) => !notification.read).length)

  function markRead(notification: Notification) {
    notifications = notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item)
  }

  const api: ApiRow[] = [
    { prop: 'NotificationBell unreadCount / open / onOpenChange', type: 'number / boolean / callback', description: 'Host-owned unread count and controlled panel or dialog state.' },
    { prop: 'NotificationBell presentation', type: "'panel' | 'dialog'", description: 'Selects the default anchored panel or a modal dialog for the open notification surface.' },
    { prop: 'NotificationBell children / label / title', type: 'Snippet / string / string', description: 'Panel content, accessible bell name, and optional visible title.' },
    { prop: 'NotificationBell class', type: 'string', description: 'Additional class for the bell container.' },
    { prop: 'NotificationList notifications / onSelect', type: 'readonly Notification[] / callback', description: 'Host-owned notification rows and selection intent.' },
    { prop: 'NotificationList groupBy / groupKey', type: "'time' | 'kind' / callback", description: 'Choose built-in grouping or supply a key derived from each notification.' },
    { prop: 'NotificationList empty', type: 'string | Snippet', description: 'Content shown when there are no notification rows.' },
    { prop: 'NotificationSettingsPanel settings / onChange', type: 'NotificationSettings / callback', description: 'Controlled delivery channel, source and policy overrides, and quiet hours.' },
    { prop: 'NotificationSettingsPanel sources / policies', type: 'readonly labeled-option arrays', description: 'Available source and policy choices for per-item delivery overrides.' },
    { prop: 'NotificationSettingsPanel disabled', type: 'boolean', description: 'Disables the settings controls without changing host-owned settings.' },
    { prop: 'deriveFeedNotifications', type: 'pure TypeScript function', description: 'Projects feed matches and health into notification rows.' },
  ]
  const usage = `import { NotificationBell, NotificationList } from '@nebula/tint/notify'

let open = $state(false)
<NotificationBell unreadCount={unread.length} {open}
  onOpenChange={(next) => open = next} presentation="dialog">
  <NotificationList {notifications} onSelect={markRead} />
</NotificationBell>`
</script>

<DocPage title="Notifications" description="A controlled bell, notification list, and delivery settings. The host owns rows, read state, and settings; Tint derives display groups and feed notifications in plain TypeScript." importPath="@nebula/tint/notify" {usage} {api} accessibility="The bell has an accessible name and expanded state. Dialog presentation uses modal focus management. Notification actions remain named buttons or links, while settings use labeled native controls.">
  <div class="notify-demo">
    <div><NotificationBell {unreadCount} open={bellOpen} onOpenChange={(next) => bellOpen = next} presentation="dialog"><NotificationList {notifications} onSelect={markRead} /></NotificationBell><p aria-live="polite">Unread: {unreadCount}</p></div>
    <div><h3>Delivery settings</h3><NotificationSettingsPanel {settings} onChange={(next) => settings = next} sources={[{ id: 'community', label: 'Community' }]} policies={[{ id: 'releases', label: 'Releases' }]} /><p aria-live="polite">Default delivery: {settings.defaultChannel}</p></div>
  </div>
</DocPage>

<style>
  .notify-demo { display: grid; gap: 1.5rem; }
  h3 { margin: 0 0 .75rem; color: var(--tint-ink); font-size: .9rem; }
  p { margin: .5rem 0 0; color: var(--tint-muted); font-size: .84rem; }
  @container (min-width: 700px) { .notify-demo { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
</style>
