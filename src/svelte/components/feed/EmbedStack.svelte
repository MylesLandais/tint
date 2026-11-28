<script lang="ts" generics="Item">
  import type { Snippet } from 'svelte'
  import Button from '../button/Button.svelte'

  let { label, items, itemKey, children }: {
    label: string
    items: readonly Item[]
    itemKey: (item: Item) => string
    children: Snippet<[Item]>
  } = $props()

  let selected = $state<string | null>(null)
  const index = $derived(Math.max(0, items.findIndex(item => itemKey(item) === selected)))
</script>

{#if items.length}
  <section class="stack" aria-label={label}>
    <header>
      <strong>{label}</strong>
      {#if items.length > 1}
        <div class="controls">
          <Button size="sm" variant="ghost" aria-label="Previous item" disabled={index === 0}
            onclick={() => selected = itemKey(items[index - 1])}>‹</Button>
          <span role="status">{index + 1} of {items.length}</span>
          <Button size="sm" variant="ghost" aria-label="Next item" disabled={index === items.length - 1}
            onclick={() => selected = itemKey(items[index + 1])}>›</Button>
        </div>
      {/if}
    </header>
    {#key itemKey(items[index])}{@render children(items[index])}{/key}
  </section>
{/if}

<style>
  .stack { min-width: 0; overflow-wrap: anywhere; padding: var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); }
  header, .controls { display: flex; align-items: center; gap: var(--tint-space-2); }
  header { justify-content: space-between; flex-wrap: wrap; margin-bottom: var(--tint-space-2); }
  header strong { font-size: var(--tint-font-size-sm); }
  .controls { color: var(--tint-muted); font-variant-numeric: tabular-nums; font-size: var(--tint-font-size-xs); }
</style>
