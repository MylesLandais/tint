<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} data-chat-message-content="" class={['min-w-0 space-y-3', className, legacyClassName]}>{@render children?.()}</div>
