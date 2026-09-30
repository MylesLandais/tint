<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    title: string
    detail?: string
    actions?: Snippet
    diagnostics?: string
    onDismiss?: () => void
    dismissLabel?: string
    children?: Snippet
  }
  let { title, detail, actions, diagnostics, onDismiss, dismissLabel = 'Dismiss', children, class: className, ...rest }: Props = $props()
</script>

<div {...rest} role="alert" data-tint-error-banner class={['flex items-start gap-3 border border-tint-danger/40 bg-tint-danger-soft p-3 text-sm', className]}>
  <div class="min-w-0 flex-1">
    <strong class="block">{title}</strong>
    {#if detail}<div class="text-tint-muted">{detail}</div>{/if}
    {@render children?.()}
    {#if diagnostics}<details class="mt-2"><summary class="cursor-pointer font-medium">Diagnostics</summary><pre class="mt-1 overflow-auto whitespace-pre-wrap text-xs">{diagnostics}</pre></details>{/if}
    {#if actions}<div class="mt-2 flex gap-2">{@render actions()}</div>{/if}
  </div>
  {#if onDismiss}
    <button type="button" aria-label={dismissLabel} onclick={() => onDismiss?.()}
      class="rounded text-tint-muted hover:text-tint-ink focus-visible:outline focus-visible:outline-tint-focus">
      <span aria-hidden="true">×</span>
    </button>
  {/if}
</div>
