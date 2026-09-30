<script lang="ts">
  import { ArrowDown } from '@lucide/svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import type { Snippet } from 'svelte'
  let { children, type = 'button', class: className, ...rest }: HTMLButtonAttributes & { children?: Snippet } = $props()
</script>
<button {...rest} {type} data-chat-scroll-to-bottom="" class={['inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-panel px-3 py-2 text-xs font-medium shadow-lg transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent', className]}>
  <ArrowDown size={16} aria-hidden="true" />{#if children}{@render children()}{:else}New messages{/if}
</button>
