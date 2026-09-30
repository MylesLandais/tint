<script lang="ts">
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<div {...rest} role="status" data-chat-typing-indicator="" class={['flex items-center gap-2 py-2 text-xs text-tint-muted', className, legacyClassName]}>
  <span aria-hidden="true" class="size-3 animate-spin motion-reduce:animate-none rounded-full border-2 border-tint-border border-t-tint-accent"></span>
  <span>{#if children}{@render children()}{:else}Assistant is responding{/if}</span>
</div>
