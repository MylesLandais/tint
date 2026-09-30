<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, class: className }: { children?: Snippet; class?: string } = $props()
</script>

<div data-table-toolbar="" class={className}>
  {@render children?.()}
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--tint-space-2);
    border-bottom: 1px solid var(--tint-border);
    background: var(--tint-surface);
    padding: var(--tint-space-2) var(--tint-space-3);
  }
</style>
