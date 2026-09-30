<script lang="ts">
  import TreeView from '../svelte/components/tree/TreeView.svelte'
  import type { TreeNode } from '../svelte/components/tree/types'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const nodes: TreeNode[] = [
    { id: 'collections', label: 'Collections', children: [
      { id: 'ambient', label: 'Ambient' },
      { id: 'electronic', label: 'Electronic' },
    ] },
    { id: 'drafts', label: 'Drafts', children: [{ id: 'mixes', label: 'Mixes' }] },
  ]
  let expandedIds = $state<string[]>(['collections'])
  let selectedIds = $state<string[]>(['ambient'])
  const api: ApiRow[] = [
    { prop: 'nodes', type: 'TreeNode[]', description: 'Hierarchical nodes with stable IDs, labels, children, and optional trailing content.' },
    { prop: 'expandedIds', type: 'readonly string[] | ReadonlySet<string>', description: 'Host-owned expanded branches.' },
    { prop: 'onExpandedChange', type: '(ids: string[]) => void', description: 'Expansion intent.' },
    { prop: 'selectedIds', type: 'readonly string[] | ReadonlySet<string>', description: 'Optional host-owned selection.' },
    { prop: 'onSelectedChange', type: '(ids: string[]) => void', description: 'Optional selection intent.' },
  ]
  const usage = `import { TreeView } from '@nebula/tint/tree'
let expandedIds = $state(['collections'])
let selectedIds = $state([])

<TreeView {nodes} {expandedIds} {selectedIds}
  onExpandedChange={(next) => expandedIds = next}
  onSelectedChange={(next) => selectedIds = next}
  aria-label="Collections" />`
</script>

<DocPage title="Tree" description="A controlled hierarchy with expansion, selection, and roving keyboard focus." importPath="@nebula/tint/tree" {usage} {api} accessibility="Arrow keys navigate visible nodes; Right and Left expand or collapse, Home and End reach the edges, and typing searches labels. Space or Enter toggles selection. When externally collapsing a branch, focus returns to its visible ancestor if it was inside that branch.">
  <div class="demo">
    <TreeView {nodes} {expandedIds} onExpandedChange={(next) => expandedIds = next} {selectedIds} onSelectedChange={(next) => selectedIds = next} aria-label="Collections" />
  </div>
  <p aria-live="polite">Selected: {selectedIds.join(', ') || 'none'}</p>
</DocPage>

<style>.demo { max-width: 24rem; } p { color: var(--tint-muted); font-size: .85rem; }</style>
