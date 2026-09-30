<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import Badge from '../badge/Badge.svelte'
  import type { ConnectionState, StatusItem } from './types'

  type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    items?: readonly StatusItem[]
    connection?: ConnectionState
    children?: Snippet
  }
  let { items = [], connection, children, class: className, ...rest }: Props = $props()
</script>

<footer {...rest} role="status" data-tint-status-bar class={['flex min-h-7 items-center gap-2 border-t border-tint-border bg-tint-panel px-3 text-xs text-tint-muted', className]}>
  {#each items as item (item.id)}<Badge tone={item.tone} leading={item.icon}>{item.label}</Badge>{/each}
  {@render children?.()}
  {#if connection}<span data-connection-state={connection.state} class="ml-auto">{connection.label}</span>{/if}
</footer>
