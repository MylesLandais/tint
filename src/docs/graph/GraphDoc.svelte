<script lang="ts">
  import type { Component } from 'svelte'
  import {
    ForceGraphView, InteractiveGraphView, TimelineView, emptySelection,
    type GraphCommand, type GraphDocument, type GraphSelection, type GraphSpan, type TimelineVariant,
    type SvelteNodeViewProps, type SvelteNodeInspectorProps,
  } from '../../svelte'
  import GraphNodeDemo from './GraphNodeDemo.svelte'
  import GraphInspectorDemo from './GraphInspectorDemo.svelte'
  import { demoGraphDocument } from './fixtures/demoDocument'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  let document = $state<GraphDocument>(structuredClone(demoGraphDocument))
  let selection = $state<GraphSelection>(emptySelection())
  let readonly = $state(false)
  let customRenderer = $state(false)
  const nodeRenderers = new Map<string, Component<SvelteNodeViewProps>>([['script', GraphNodeDemo]])
  const inspectorRenderers = new Map<string, Component<SvelteNodeInspectorProps>>([['script', GraphInspectorDemo]])
  let variant = $state<TimelineVariant>('gantt')
  let lastCommand = $state('none')
  let spans = $state<GraphSpan[]>([
    { id: 'receive', nodeId: 'n-trigger', start: 0, end: 12, status: 'succeeded' },
    { id: 'normalize', nodeId: 'n-normalize', start: 12, end: 45, status: 'succeeded' },
    { id: 'enrich', nodeId: 'n-script', start: 48, end: 118, status: 'running' },
    { id: 'score', nodeId: 'n-python', start: 54, end: 94, status: 'failed' },
  ])
  function changeSpan(id: string, next: { start: number; end: number }) {
    spans = spans.map((span) => span.id === id ? { ...span, ...next } : span)
  }
  function command(value: GraphCommand) { lastCommand = value.type }

  const api: ApiRow[] = [
    { prop: 'document / onDocumentChange', type: 'GraphDocument / callback', description: 'Host-owned graph and accepted changes. The component does not keep a document copy.' },
    { prop: 'selection / onSelectionChange', type: 'GraphSelection / callback', description: 'Optional controlled node, edge, and group selection.' },
    { prop: 'registry / nodeRenderers / inspectorRenderers', type: 'GraphNodeRegistry / Svelte component maps', description: 'Pure definitions plus optional Svelte node and inspector views keyed by node kind.' },
    { prop: 'readonly / viewport / onViewportChange', type: 'boolean / GraphViewport / callback', description: 'Edit availability and host-directed camera state.' },
    { prop: 'validationByNodeId / runtimeByNodeId', type: 'NodeValidationMap / ReadonlyMap<string, NodeRuntimeSummary>', description: 'Host-provided validation issues and runtime status used by graph views and inspectors.' },
    { prop: 'showInspector / showFullscreenControl', type: 'boolean', description: 'Show or hide the interactive graph inspector and fullscreen control.' },
    { prop: 'onCommand', type: '(command: GraphCommand) => void', description: 'Receives graph edit intents from interactive, force, and timeline views.' },
    { prop: 'class / className', type: 'string', description: 'Optional class on the graph view surface.' },
    { prop: 'ForceGraphView layout / static', type: 'ForceLayoutOptions / boolean', description: 'Deterministic force projection, settled instantly when motion is reduced or static.' },
    { prop: 'ForceGraphView height', type: 'number', description: 'Height of the force projection in pixels.' },
    { prop: 'TimelineView spans / variant / onSpanChange', type: 'GraphSpan[] / TimelineVariant / callback', description: 'Host-owned runtime intervals and optional range editing.' },
  ]
  const usage = `import { InteractiveGraphView, ForceGraphView, TimelineView, createNodeRegistry } from '@nebula/tint/graph'

let document = $state(initialGraph)
let selection = $state(emptySelection())
<InteractiveGraphView {document} {selection}
  nodeRenderers={new Map([['script', ScriptNode]])}
  inspectorRenderers={new Map([['script', ScriptInspector]])}
  onDocumentChange={(next) => document = next}
  onSelectionChange={(next) => selection = next} />
<ForceGraphView {document} static={true} />
<TimelineView {document} {spans} variant="gantt" />`
</script>

<DocPage title="Graph and Timeline" description="Controlled graph editing, a force network projection, and runtime timelines over one plain TypeScript graph document. Select, pan, zoom, connect ports, and inspect nodes in the live canvas." importPath="@nebula/tint/graph" {usage} {api} accessibility="Graph nodes and edges are named keyboard targets, including custom Svelte renderers. Arrow keys move a focused editable node; Enter selects and Delete removes selected items. Zoom and fit have named controls. Force nodes are keyboard-selectable, timeline bars are buttons, and range handles are labeled sliders.">
  <div class="graph-demo">
    <label class="readonly"><input type="checkbox" bind:checked={readonly} /> Read only</label>
    <label class="readonly"><input type="checkbox" bind:checked={customRenderer} /> Custom script renderer and inspector</label>
    <div class="interactive"><InteractiveGraphView {document} {selection} {readonly}
      nodeRenderers={customRenderer ? nodeRenderers : undefined} inspectorRenderers={customRenderer ? inspectorRenderers : undefined}
      onDocumentChange={(next) => document = next} onSelectionChange={(next) => selection = next} onCommand={command} /></div>
    <p aria-live="polite">Selected nodes: {selection.nodeIds.size} · Last command: {lastCommand}</p>
    <div class="projections">
      <section><h3>Force network</h3><ForceGraphView {document} {selection} static={true} height={280} onSelectionChange={(next) => selection = next} onCommand={command} /></section>
      <section><h3>Timeline</h3><label>Layout <select class="tint-select" bind:value={variant}><option value="gantt">Gantt</option><option value="trace">Trace</option><option value="range">Range</option></select></label><TimelineView {document} {spans} {variant} {selection} onSpanChange={changeSpan} onSelectionChange={(next) => selection = next} onCommand={command} /></section>
    </div>
  </div>
</DocPage>

<style>
  .graph-demo { display: grid; gap: 1rem; min-width: 0; }
  .interactive { min-width: 0; height: 34rem; }
  .readonly, .projections label { display: inline-flex; align-items: center; gap: .4rem; color: var(--tint-ink); font-size: .84rem; }
  .readonly input { accent-color: var(--tint-accent); }
  .projections { display: grid; gap: 1rem; min-width: 0; }
  .projections section { min-width: 0; }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  p { margin: 0; color: var(--tint-muted); font-size: .8rem; }
  select { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: .25rem .5rem; color: var(--tint-ink); }
  select:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  @container (min-width: 820px) { .projections { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
