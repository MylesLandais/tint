<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { WorkspaceBreadcrumb } from './types'

  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    breadcrumbs?: readonly WorkspaceBreadcrumb[]
    title: string
    subtitle?: string
    actions?: Snippet
    children?: Snippet
  }
  let { breadcrumbs = [], title, subtitle, actions, children, class: className, ...rest }: Props = $props()
</script>

<header {...rest} data-tint-workspace-header class={['flex min-h-16 flex-wrap items-center gap-3 border-b border-tint-border bg-tint-panel px-4 py-2', className]}>
  <div class="min-w-0 flex-1">
    {#if breadcrumbs.length}
      <nav aria-label="Breadcrumb"><ol class="m-0 flex list-none items-center gap-1 p-0 text-xs text-tint-muted">
        {#each breadcrumbs as item, index}
          <li class="flex items-center gap-1">
            {#if index > 0}<span aria-hidden="true">/</span>{/if}
            {#if item.href}<a href={item.href} class="hover:text-tint-ink">{item.label}</a>{:else}<span aria-current="page">{item.label}</span>{/if}
          </li>
        {/each}
      </ol></nav>
    {/if}
    <h1 class="m-0 truncate text-base font-semibold">{title}</h1>
    {#if subtitle}<p class="m-0 truncate text-xs text-tint-muted">{subtitle}</p>{/if}
  </div>
  {@render children?.()}
  {#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
</header>
