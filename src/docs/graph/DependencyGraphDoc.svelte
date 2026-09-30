<script lang="ts">
  import { getContext } from 'svelte'
  import { InteractiveGraphView, type GraphSelection } from '../../svelte'
  import { docsGraphNodes } from '../generated/docsGraph'
  import DocPage from '../svelte/DocPage.svelte'
  import { DOC_ROUTE_PATHS_CONTEXT } from '../svelte/routing'
  import type { ApiRow } from '../svelte/types'
  import { dependencyDocument } from './dependencyDocument'

  const routePaths = getContext<ReadonlySet<string>>(DOC_ROUTE_PATHS_CONTEXT)
  const document = dependencyDocument()
  const edgeCount = docsGraphNodes.reduce((count, node) => count + node.imports.length, 0)
  let selected = $state('')

  function select(selection: GraphSelection): void {
    if (selection.nodeIds.size !== 1) { selected = ''; return }
    const [nodeId] = selection.nodeIds
    selected = nodeId
    const path = `components/${nodeId}`
    if (routePaths?.has(path)) window.location.hash = `#/${path}`
  }

  const api: ApiRow[] = [
    { prop: 'docsGraphNodes', type: 'readonly DocsGraphNode[]', description: 'Committed, generated component imports and deterministic positions.' },
    { prop: 'InteractiveGraphView document', type: 'GraphDocument', description: 'Read-only projection of the generated data.' },
    { prop: 'onSelectionChange', type: '(selection: GraphSelection) => void', description: 'Navigates to a public Svelte component page when one node is selected.' },
  ]
  const usage = `# Regenerate after changing cross-component imports:
python3 scripts/gen-docs-graph.py

import { InteractiveGraphView } from '@nebula/tint/graph'
import { docsGraphNodes } from './generated/docsGraph'

<InteractiveGraphView document={dependencyDocument()} readonly showInspector={false} />`
</script>

<DocPage title="Dependency Graph" description={`The generated component import graph contains ${docsGraphNodes.length} packages and ${edgeCount} edges. Select a node to open its Svelte page when available.`} importPath="scripts/gen-docs-graph.py" {usage} {api} accessibility="Every graph node is a named keyboard target. Use Enter to select a node, and use the graph's zoom and fit controls to navigate the canvas. Generated descriptions state each import relationship in text.">
  <div class="graph"><InteractiveGraphView {document} readonly showInspector={false} showFullscreenControl={false} onSelectionChange={select} /></div>
  {#if selected}<p role="status">Selected package: {selected}</p>{/if}
</DocPage>

<style>
  .graph { height: 34rem; min-width: 0; }
  p { color: var(--tint-muted); font-size: .82rem; }
</style>
