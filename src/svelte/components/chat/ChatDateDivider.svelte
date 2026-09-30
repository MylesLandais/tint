<script lang="ts">
  import { CalendarDays } from '@lucide/svelte'
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} role="separator" data-chat-date-divider="" class={['flex items-center gap-3 py-3 text-xs font-medium text-tint-muted', className, legacyClassName]}>
  <span class="h-px flex-1 bg-tint-border"></span><CalendarDays size={16} aria-hidden="true" />
  <span>{@render children?.()}</span><span class="h-px flex-1 bg-tint-border"></span>
</div>
