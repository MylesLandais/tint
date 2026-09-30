<script lang="ts">
  import NotificationBell from './NotificationBell.svelte'
  import type { NotificationBellProps } from './types'

  let { unreadCount, open, onOpenChange, presentation }: Omit<NotificationBellProps, 'children'> = $props()
</script>

<NotificationBell {unreadCount} {open} {onOpenChange} {presentation}>
  <p>Notification body</p>
</NotificationBell>
