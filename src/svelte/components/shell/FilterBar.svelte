<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & { children: Snippet; actions?: Snippet }
  let { children, actions, class: className, ...rest }: Props = $props()
</script>

<div {...rest} data-tint-filter-bar class={['flex flex-wrap items-end justify-between gap-3 border-b border-tint-border bg-tint-panel p-3', className]}>
  <div class="flex flex-wrap items-end gap-3">{@render children()}</div>
  {@render actions?.()}
</div>
