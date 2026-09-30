<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import Spinner from '../icon/Spinner.svelte'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    label?: string
    description?: string
    icon?: Snippet
    children?: Snippet
  }
  let { label = 'Loading', description, icon, children, class: className, ...rest }: Props = $props()
</script>

<div {...rest} role="status" data-tint-loading-state class={['grid place-items-center gap-2 p-8 text-sm text-tint-muted', className]}>
  {#if icon}{@render icon()}{:else}<Spinner />{/if}
  <span>{label}</span>
  {#if description}<span>{description}</span>{/if}
  {@render children?.()}
</div>
