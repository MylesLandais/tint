<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} data-chat-message-actions="" class={['flex items-center gap-1', className, legacyClassName]}>{@render children?.()}</div>
