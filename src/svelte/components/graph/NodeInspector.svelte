<script lang="ts">
  import type { Component } from 'svelte'
  import type {
    GraphCommand, GraphEdge, GraphNode, GraphNodeRegistry, NodeRuntimeSummary,
    NodeValidationMap,
  } from '../../../core/graph'
  import NodeConfigurationForm from './NodeConfigurationForm.svelte'
  import type { SvelteNodeInspectorProps } from './types'

  let { nodes, edges, registry, readonly = false, validationByNodeId, runtimeByNodeId,
    inspectorRenderers, dispatch }: {
      nodes: readonly GraphNode[]
      edges: readonly GraphEdge[]
      registry: GraphNodeRegistry
      readonly?: boolean
      validationByNodeId?: NodeValidationMap
      runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
      inspectorRenderers?: ReadonlyMap<string, Component<SvelteNodeInspectorProps>>
      dispatch: (command: GraphCommand) => void
    } = $props()

  function describeConfiguration(configuration: unknown): string {
    try {
      return JSON.stringify(configuration, (_key, value: unknown) =>
        typeof value === 'string' && value.length > 120
          ? `${value.slice(0, 120)}… (${value.length} chars)`
          : value, 2) ?? String(configuration)
    } catch {
      return '[Configuration cannot be displayed]'
    }
  }
</script>

<aside class="inspector" aria-label="Graph inspector">
  <header><h2>Inspector</h2><p>{nodes.length + edges.length === 0 ? 'Nothing selected' : `${nodes.length} node(s), ${edges.length} edge(s)`}</p></header>
  {#if nodes.length === 0 && edges.length === 0}
    <p class="empty">Click a node or edge. Drag the canvas to pan, scroll to zoom, and drag nodes to reposition{readonly ? ' (read-only: moves are disabled)' : ''}.</p>
  {/if}
  {#each nodes as node (node.id)}
    {@const issues = validationByNodeId?.get(node.id) ?? []}
    {@const runtime = runtimeByNodeId?.get(node.id)}
    {@const definition = registry.get(node.kind)}
    {@const Inspector = inspectorRenderers?.get(node.kind)}
    <section class="card">
      <h3>{node.presentation?.label ?? node.kind}</h3>
      <dl>
        <div><dt>Id</dt><dd><code>{node.id}</code></dd></div>
        <div><dt>Kind</dt><dd>{node.kind}</dd></div>
        {#if runtime}<div><dt>Runtime</dt><dd>{runtime.status}{runtime.detail ? ` — ${runtime.detail}` : ''}</dd></div>{/if}
        <div><dt>Position</dt><dd>{Math.round(node.position.x)}, {Math.round(node.position.y)}</dd></div>
        <div><dt>Ports</dt><dd>{node.ports.map((port) => port.key).join(', ') || 'none'}</dd></div>
        {#if issues.length}
          <div><dt>Issues</dt><dd><ul>{#each issues as issue, index (`${issue.code}:${issue.path ?? index}`)}<li data-severity={issue.severity}>{issue.message}</li>{/each}</ul></dd></div>
        {/if}
        <div class="configuration"><dt>Configuration</dt><dd>
          {#if Inspector}
            <Inspector {node} {readonly} validation={issues} {dispatch} />
          {:else if definition?.formSchema}
            <NodeConfigurationForm {node} schema={definition.formSchema} {readonly} {dispatch} />
          {:else}
            <pre>{describeConfiguration(node.configuration)}</pre>
          {/if}
        </dd></div>
      </dl>
    </section>
  {/each}
  {#each edges as edge (edge.id)}
    <section class="card"><h3>Edge</h3><dl>
      <div><dt>Id</dt><dd><code>{edge.id}</code></dd></div>
      <div><dt>From</dt><dd><code>{edge.source.nodeId}.{edge.source.portId}</code></dd></div>
      <div><dt>To</dt><dd><code>{edge.target.nodeId}.{edge.target.portId}</code></dd></div>
    </dl></section>
  {/each}
</aside>

<style>
  .inspector { min-width: 0; overflow: auto; border-left: 1px solid var(--tint-border); background: var(--tint-panel); color: var(--tint-ink); }
  header { padding: .75rem; border-bottom: 1px solid var(--tint-border); }
  h2, h3, p { margin: 0; }
  h2 { font-size: .875rem; }
  header p, .empty { color: var(--tint-muted); font-size: .75rem; }
  .empty { padding: .75rem; line-height: 1.5; }
  .card { margin: .75rem; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); }
  h3 { margin-bottom: .75rem; font-size: .875rem; }
  dl { display: grid; gap: .5rem; margin: 0; }
  dl > div { display: grid; grid-template-columns: 5rem minmax(0, 1fr); gap: .5rem; font-size: .75rem; }
  dt { color: var(--tint-muted); }
  dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
  code, pre { font-family: var(--tint-font-mono, monospace); }
  pre { max-width: 100%; overflow: auto; white-space: pre-wrap; font-size: .6875rem; }
  ul { margin: 0; padding-left: 1rem; }
  li[data-severity='error'] { color: var(--tint-danger-ink); }
  li[data-severity='warning'] { color: var(--tint-warning); }
  .configuration { display: block; }
  .configuration dt { margin-bottom: .375rem; }
</style>
