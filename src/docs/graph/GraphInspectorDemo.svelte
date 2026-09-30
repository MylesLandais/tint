<script lang="ts">
  import type { SvelteNodeInspectorProps } from '../../svelte/components/graph'
  let { node, validation }: SvelteNodeInspectorProps = $props()
  let source = $derived((node.configuration as { sourceRef?: string } | null)?.sourceRef ?? 'No source')
</script>

<div class="custom-inspector">
  <strong>Script details</strong>
  <code>{source}</code>
  <span>{validation.length} validation issues</span>
</div>

<style>
  .custom-inspector { display: grid; gap: .4rem; color: var(--tint-ink); }
  code { overflow-wrap: anywhere; color: var(--tint-muted); }
  span { color: var(--tint-muted); font-size: .75rem; }
</style>
