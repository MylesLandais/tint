<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    title: string
    description?: string
    icon?: Snippet
    actions?: Snippet
    action?: Snippet
    children?: Snippet
  }
  let { title, description, icon, actions, action, children, class: className, ...rest }: Props = $props()
</script>

<div {...rest} data-tint-empty-state class={['grid place-items-center gap-2 p-8 text-center', className]}>
  {@render icon?.()}
  <h2 class="m-0 text-base font-semibold">{title}</h2>
  {#if description}<p class="m-0 text-sm text-tint-muted">{description}</p>{/if}
  {@render children?.()}
  {#if actions}{@render actions()}{:else}{@render action?.()}{/if}
</div>
