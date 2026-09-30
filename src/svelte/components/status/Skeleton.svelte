<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { normalizeSkeletonLines } from '../../../core/status/model'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    lines?: number
    label?: string
  }

  let { lines = 3, label = 'Loading', class: className, ...rest }: Props = $props()
  let count = $derived(normalizeSkeletonLines(lines))
</script>

<div {...rest} role="status" aria-label={label} class={['tint-skeleton', className]}>
  {#each Array(count) as _, index (index)}<span aria-hidden="true"></span>{/each}
</div>

<style>
  .tint-skeleton { display: grid; gap: var(--tint-space-2); }
  span { height: .75rem; border-radius: var(--tint-radius-sm); background: var(--tint-border); animation: pulse 1.5s ease-in-out infinite; }
  span:last-child { width: 66.666%; }
  @keyframes pulse { 50% { opacity: .45; } }
  @media (prefers-reduced-motion: reduce) { span { animation: none; } }
</style>
