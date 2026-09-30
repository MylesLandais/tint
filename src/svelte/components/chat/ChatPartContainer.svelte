<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} class={['min-w-0', className, legacyClassName]}>{@render children?.()}</div>
