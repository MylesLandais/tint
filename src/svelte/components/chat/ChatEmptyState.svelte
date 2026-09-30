<script lang="ts">
  import { MessageCircle } from '@lucide/svelte'
  import type { ChatSlotProps } from './types'
  let { children, class: className, className: legacyClassName, ...rest }: ChatSlotProps = $props()
</script>
<section {...rest} data-chat-empty-state="" class={['m-auto flex max-w-sm flex-col items-center gap-3 px-6 py-12 text-center text-sm text-tint-muted', className, legacyClassName]}>
  <span class="grid size-11 place-items-center rounded-2xl bg-tint-accent-soft text-tint-accent" aria-hidden="true"><MessageCircle size={20} /></span>
  {#if children}{@render children()}{:else}Start a conversation{/if}
</section>
