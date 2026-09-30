<script lang="ts">
  import type { SvelteNodeViewProps } from '../../svelte/components/graph'
  let { node, selected, focused, validation, runtime }: SvelteNodeViewProps = $props()
</script>

<div class="custom-node" data-selected={selected} data-focused={focused}>
  <small>Custom script node</small>
  <strong>{node.presentation?.label ?? node.kind}</strong>
  <span>{runtime?.status ?? (validation.length ? 'Review' : 'Ready')}</span>
</div>

<style>
  .custom-node { display: flex; height: 100%; flex-direction: column; gap: .35rem; padding: .6rem .7rem; border-radius: inherit; background: var(--tint-accent-soft); color: var(--tint-ink); }
  .custom-node[data-focused='true'] { outline: 2px solid var(--tint-focus); outline-offset: -2px; }
  small { color: var(--tint-muted); font-size: .65rem; text-transform: uppercase; }
  strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .85rem; }
  span { font-size: .7rem; }
</style>
