<script lang="ts">
  import { AnnotationCanvas, Button, type AnnotationRegion, type AnnotationTool, type VectorGeometry } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400"><rect width="720" height="400" fill="#d3dbd5"/><path d="M0 300L180 150L360 310L570 80L720 230V400H0Z" fill="#6f8c7a"/><circle cx="155" cy="90" r="34" fill="#f1df9a"/></svg>')}`
  const image = { id: 'landscape', url: source, width: 720, height: 400 }
  let regions = $state<AnnotationRegion[]>([
    { id: 'ridge', label: 'Ridge', geometry: { kind: 'box', x: .55, y: .12, width: .35, height: .7 }, tone: 'proposal' },
  ])
  let selectedId = $state<string | null>(null)
  let tool = $state<AnnotationTool>('select')
  let nextId = 1

  function create(geometry: VectorGeometry) {
    const id = `region-${nextId++}`
    regions = [...regions, { id, label: `Region ${nextId - 1}`, geometry }]
    selectedId = id
    tool = 'select'
  }
  function change(id: string, geometry: VectorGeometry) {
    regions = regions.map((region) => region.id === id ? { ...region, geometry } : region)
  }
  function remove(id: string) {
    regions = regions.filter((region) => region.id !== id)
    if (selectedId === id) selectedId = null
  }

  const api: ApiRow[] = [
    { prop: 'image / regions', type: 'AnnotationImage / readonly AnnotationRegion[]', description: 'Orientation-corrected frame and host-owned regions.' },
    { prop: 'tool / selectedId', type: 'AnnotationTool / string | null', description: 'Host-controlled drawing mode and selected region.' },
    { prop: 'onSelect / onCreate / onGeometryChange', type: 'intent callbacks', description: 'Selection, new vector geometry, and edited geometry intents.' },
    { prop: 'onMaskChange / onDelete', type: 'Blob callback / ID callback', description: 'Painted PNG mask and delete intent; the host stores artifacts.' },
    { prop: 'zoom / brushSize / disabled', type: 'number / number / boolean', description: 'Display scale, paint width, and interaction availability.' },
  ]
  const usage = `import { AnnotationCanvas } from '@nebula/tint/annotation'

<AnnotationCanvas {image} {regions} {tool} {selectedId}
  onSelect={(id) => selectedId = id}
  onCreate={(geometry) => regions = [...regions, { id: crypto.randomUUID(), label: 'Region', geometry }]}
  onGeometryChange={(id, geometry) => regions = regions.map((region) => region.id === id ? { ...region, geometry } : region)} />`
</script>

<DocPage title="Annotation Canvas" description="Controlled source-frame geometry for curation and review. The host owns frames, labels, evidence, history, and persistence; Tint turns drawing gestures into vector or mask intents." importPath="@nebula/tint/annotation" {usage} {api} accessibility="The drawing stage is a named keyboard-focusable application with visible focus. Enter completes a polygon, Escape cancels, and Delete removes the selected region through a host callback. Tool buttons expose their pressed state.">
  <div class="annotation-demo">
    <div class="tools" role="group" aria-label="Annotation tool">
      {#each ['select', 'box', 'polygon'] as option (option)}
        <Button size="sm" variant={tool === option ? 'primary' : 'ghost'} aria-pressed={tool === option} onclick={() => tool = option as AnnotationTool}>{option}</Button>
      {/each}
    </div>
    <AnnotationCanvas {image} {regions} {selectedId} {tool} onSelect={(id) => selectedId = id} onCreate={create} onGeometryChange={change} onDelete={remove} />
    <p aria-live="polite">Tool: {tool} · Regions: {regions.length} · Selected: {selectedId ?? 'none'}</p>
  </div>
</DocPage>

<style>
  .annotation-demo { display: grid; gap: .75rem; }
  .tools { display: flex; flex-wrap: wrap; gap: .5rem; }
  p { margin: 0; color: var(--tint-muted); font-size: .84rem; }
</style>
