<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} data-chat-composer-attachments="" class={['flex flex-wrap gap-2', className, legacyClassName]}>{@render children?.()}</div>
