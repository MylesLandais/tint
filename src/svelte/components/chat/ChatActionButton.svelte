<script lang="ts">
  import type { ChatActionButtonProps } from './types'
  let { label, pending = false, disabled = false, type = 'button', children, class: className, ...rest }: ChatActionButtonProps = $props()
</script>

<button {...rest} {type} aria-label={label} aria-busy={pending || undefined} disabled={disabled || pending}
  class={['inline-flex size-9 shrink-0 items-center justify-center rounded transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-50', className]}>
  {#if pending}<span role="status" aria-label="Pending" class="animate-spin motion-reduce:animate-none">◌</span>{:else}{@render children?.()}{/if}
</button>
