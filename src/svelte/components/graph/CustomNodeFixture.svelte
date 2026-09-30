<script lang="ts">
  import type { SvelteNodeViewProps } from './types'
  let { node, selected, focused }: SvelteNodeViewProps = $props()
</script>

<span data-testid="custom-node" data-selected={selected} data-focused={focused}>{node.presentation?.label}</span>
<button type="button">Inner action</button>
