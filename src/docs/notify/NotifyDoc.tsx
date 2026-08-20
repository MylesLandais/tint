import { useMemo, useState, useSyncExternalStore } from 'react'
import { DEMO_NOTIFY_SETTINGS } from '../../components/feed'
import {
  NotificationBell,
  NotificationList,
  NotificationSettingsPanel,
  deriveNotifications,
} from '../../components/notify'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import {
  getDemoFeedStore,
  subscribeDemoFeedStore,
} from '../feed/demoStore'

const usage = `import {
  NotificationBell,
  NotificationList,
  NotificationSettingsPanel,
  deriveNotifications,
} from 'tint/notify'

// Mount the bell once near the shell; host owns settings + read ids.
<NotificationBell unreadCount={unread} open={open} onOpenChange={setOpen}>
  <NotificationList notifications={rows} />
</NotificationBell>`

/**
 * Small shell helper pattern — docs-only illustration of mounting the bell
 * beside workbench chrome without inventing a second notification store.
 */
export function DocsNotificationShell({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { feed, policy } = useSyncExternalStore(
    subscribeDemoFeedStore,
    getDemoFeedStore,
    getDemoFeedStore,
  )
  const [settings, setSettings] = useState(DEMO_NOTIFY_SETTINGS)
  const notifications = useMemo(
    () => deriveNotifications(feed, settings),
    [feed, settings],
  )
  const unread = notifications.filter((row) => !row.read).length
  const sourceLabels = Object.fromEntries(
    feed.sources.map((source) => [source.id, source.handle]),
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <NotificationBell
        unreadCount={unread}
        open={open}
        onOpenChange={onOpenChange}
        presentation="panel"
      >
        <NotificationList
          notifications={notifications}
          sourceLabels={sourceLabels}
          groupBy="time"
        />
      </NotificationBell>
      <NotificationSettingsPanel
        className="min-w-[16rem] flex-1 rounded-xl border border-tint-border bg-tint-panel p-3"
        settings={settings}
        onChange={setSettings}
        sources={feed.sources.map((source) => ({
          id: source.id,
          label: source.handle,
        }))}
        policies={policy.rules.map((rule) => ({
          id: rule.id,
          label: rule.name,
        }))}
      />
    </div>
  )
}

export function NotifyDoc() {
  const [open, setOpen] = useState(true)

  return (
    <DocsPage
      route="components/notify"
      title="Notify"
      intro="Bell, grouped list, and per-source/policy settings. Notifications are a read model over FeedDocument matches via deriveNotifications — the bell never invents rows."
      note="Mount NotificationBell once near the docs shell (see DocsNotificationShell below) so Feed and Activity workbenches can share the same toast host."
    >
      <DocsSection id="preview" title="Preview">
        <DocsPreview>
          <DocsNotificationShell open={open} onOpenChange={setOpen} />
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable
          rows={[
            {
              name: 'unreadCount',
              type: 'number',
              required: true,
              description: 'Badge count; host derives from Notification[].',
            },
            {
              name: 'open',
              type: 'boolean',
              required: true,
              description: 'Controlled panel / dialog visibility.',
            },
            {
              name: 'onOpenChange',
              type: '(open: boolean) => void',
              required: true,
              description: 'Open intent from the bell trigger.',
            },
            {
              name: 'presentation',
              type: "'panel' | 'dialog'",
              description: 'Inline Panel vs modal Dialog.',
            },
            {
              name: 'title',
              type: 'string',
              description: 'Panel / dialog title.',
            },
            {
              name: 'children',
              type: 'ReactNode',
              required: true,
              description: 'List / settings body inside the disclosure.',
            },
            {
              name: 'label',
              type: 'string',
              description: 'Accessible name for the bell button.',
            },
            {
              name: 'notifications',
              type: 'readonly Notification[]',
              required: true,
              description: 'NotificationList rows from deriveNotifications.',
            },
            {
              name: 'groupBy',
              type: "'time' | 'source'",
              description: 'Grouping axis for the list.',
            },
            {
              name: 'sourceLabels',
              type: 'Record<string, string>',
              description: 'Labels when groupBy is source.',
            },
            {
              name: 'onSelect',
              type: '(notification: Notification) => void',
              description: 'Row click intent.',
            },
            {
              name: 'whyHref',
              type: '(notification: Notification) => string | undefined',
              description: 'Optional policy “why” link builder.',
            },
            {
              name: 'empty',
              type: 'ReactNode',
              description: 'Empty-state content.',
            },
            {
              name: 'settings',
              type: 'NotificationSettings',
              required: true,
              description: 'Controlled settings document.',
            },
            {
              name: 'onChange',
              type: '(next: NotificationSettings) => void',
              required: true,
              description: 'Settings mutation intent.',
            },
            {
              name: 'sources',
              type: '{ id: string; label: string }[]',
              description: 'Per-source channel overrides.',
            },
            {
              name: 'policies',
              type: '{ id: string; label: string }[]',
              description: 'Per-policy channel overrides.',
            },
            {
              name: 'disabled',
              type: 'boolean',
              description: 'Locks settings controls.',
            },
            { name: 'className', type: 'string', description: 'Appended to the root element.' },
          ]}
        />
      </DocsSection>
    </DocsPage>
  )
}
