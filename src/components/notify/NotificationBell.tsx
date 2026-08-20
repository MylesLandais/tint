import { useId, type ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '../badge'
import { Button } from '../button'
import { Dialog } from '../dialog'
import { Icon } from '../icon'
import { Panel } from '../panel'
import { cn } from '../../lib/utils'

export type NotificationBellProps = {
  /** Unread count shown on the badge. Host derives from Notification[]. */
  unreadCount: number
  /** Controlled open state for the panel / dialog. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prefer 'panel' inline or 'dialog' modal. */
  presentation?: 'panel' | 'dialog'
  /** Panel / dialog title. */
  title?: string
  /** List + settings body. */
  children: ReactNode
  className?: string
  /** Accessible name for the bell button. */
  label?: string
}

/**
 * Bell trigger + unread Badge that opens a Panel or Dialog.
 *
 * The list is a child so hosts can compose NotificationList / settings without
 * the bell owning a second notification store.
 */
export function NotificationBell({
  unreadCount,
  open,
  onOpenChange,
  presentation = 'panel',
  title = 'Notifications',
  children,
  className,
  label = 'Notifications',
}: NotificationBellProps) {
  const panelId = useId()
  const badge =
    unreadCount > 0 ? (
      <Badge tone="accent" className="absolute -top-1 -right-1 min-w-4 justify-center px-1">
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    ) : null

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-expanded={open}
      aria-controls={presentation === 'panel' ? panelId : undefined}
      className="relative"
      onClick={() => onOpenChange(!open)}
      leading={<Icon icon={Bell} size="sm" />}
    />
  )

  if (presentation === 'dialog') {
    return (
      <div data-tint-notification-bell="" className={cn('relative inline-flex', className)}>
        {trigger}
        {badge}
        <Dialog open={open} onOpenChange={onOpenChange} title={title}>
          {children}
        </Dialog>
      </div>
    )
  }

  return (
    <div data-tint-notification-bell="" className={cn('relative inline-flex flex-col gap-2', className)}>
      <div className="relative inline-flex self-start">
        {trigger}
        {badge}
      </div>
      <div id={panelId}>
        <Panel
          title={title}
          expanded={open}
          onExpandedChange={onOpenChange}
          className="min-w-[18rem]"
        >
          <div className="p-2">{children}</div>
        </Panel>
      </div>
    </div>
  )
}
