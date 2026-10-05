import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { Notification, NotificationSettings } from '../../../core/notify'

export type NotificationBellProps = {
  /** The host derives this count from its notification document. */
  unreadCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `panel` expands inline, `popover` anchors a non-modal surface to the bell, `dialog` is modal. */
  presentation?: 'panel' | 'popover' | 'dialog'
  title?: string
  children: Snippet
  class?: string
  label?: string
}

export type NotificationListProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> & {
  notifications: readonly Notification[]
  groupBy?: 'time' | 'kind'
  groupKey?: (notification: Notification) => string
  onSelect?: (notification: Notification) => void
  empty?: string | Snippet
}

export type NotificationSettingsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> & {
  settings: NotificationSettings
  onChange: (next: NotificationSettings) => void
  sources?: readonly { id: string; label: string }[]
  policies?: readonly { id: string; label: string }[]
  disabled?: boolean
}
