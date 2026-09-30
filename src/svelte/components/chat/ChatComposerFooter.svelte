<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} data-chat-composer-footer="" class={['flex items-center justify-between gap-3', className, legacyClassName]}>{@render children?.()}</div>
