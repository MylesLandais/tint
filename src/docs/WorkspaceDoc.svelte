<script lang="ts">
  import { MediaWorkspace, WorkspaceGrid, type MediaRelease, type WorkspaceDocument, type WorkspaceItem } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let workspace = $state<WorkspaceDocument>({
    id: 'docs-dashboard', revision: '1',
    layouts: {
      lg: [
        { id: 'metrics', x: 0, y: 0, w: 5, h: 2 },
        { id: 'queue', x: 6, y: 0, w: 5, h: 2 },
      ],
      sm: [
        { id: 'metrics', x: 0, y: 0, w: 4, h: 2 },
        { id: 'queue', x: 0, y: 2, w: 4, h: 2 },
      ],
    },
  })
  let query = $state('')
  let selection = $state<readonly string[]>([])
  let queued = $state<readonly string[]>([])
  const releases: MediaRelease[] = [
    { id: 'atlas', title: 'Bright Atlas 1080p', indexer: 'Harbor', size: '3.2 GiB', peers: '48', age: '2 days', score: 94 },
    { id: 'river', title: 'River Echo 720p', indexer: 'Beacon', size: '1.4 GiB', peers: '16', age: '1 week', score: 81 },
    { id: 'night', title: 'Night Signal 1080p', indexer: 'Harbor', size: '4.8 GiB', peers: '32', age: '4 days', score: 88 },
  ]

  const api: ApiRow[] = [
    { prop: 'WorkspaceGrid document / onDocumentChange', type: 'WorkspaceDocument / callback', description: 'Host-owned revisioned layouts and move/resize commands.' },
    { prop: 'WorkspaceGrid breakpoints / columns', type: 'Record<string, number>', description: 'Container width thresholds and columns per layout; viewport width is ignored.' },
    { prop: 'WorkspaceGrid renderItem', type: 'Snippet<[WorkspaceItem, string]>', description: 'Host-rendered widget content for each item and active breakpoint.' },
    { prop: 'MediaWorkspace releases / query / selection', type: 'MediaRelease[] / string / string[]', description: 'Host-owned release rows, search query, and selected IDs.' },
    { prop: 'MediaWorkspace onQueuePreview', type: '(ids: readonly string[]) => void', description: 'Intent to queue the selected release IDs.' },
  ]
  const usage = `import { WorkspaceGrid, MediaWorkspace } from '@nebula/tint/table'

let document = $state<WorkspaceDocument>(initialWorkspace)
{#snippet widget(item: WorkspaceItem, breakpoint: string)}
  <DashboardWidget {item} {breakpoint} />
{/snippet}
<WorkspaceGrid {document} renderItem={widget}
  onDocumentChange={(next) => document = next} />

<MediaWorkspace title="New releases" {releases} {query} {selection}
  onQueryChange={(next) => query = next}
  onSelectionChange={(next) => selection = next} />`
</script>

<DocPage title="Workspace Layouts" description="A revisioned, container-aware widget grid and a controlled media release workspace. Hosts own layout commands, search, selection, and queue intents." importPath="@nebula/tint/table" {usage} {api} accessibility="Grid item handles are named buttons: Alt plus arrow keys moves an item, Control plus Alt resizes, and Shift increases the step. Media search is labeled, the release table exposes row selection, and queue actions state the selected count.">
  <div class="workspace-demo">
    <section><h3>Widget grid</h3>
      {#snippet widget(item: WorkspaceItem, breakpoint: string)}<p>{item.id} at {breakpoint}</p>{/snippet}
      <WorkspaceGrid document={workspace} renderItem={widget} breakpoints={{ lg: 700, sm: 0 }} columns={{ lg: 12, sm: 4 }} collisionMode="free" onDocumentChange={(next) => workspace = next} />
      <p aria-live="polite">Metric panel x: {workspace.layouts.lg?.[0]?.x ?? 0} · Revision: {workspace.revision}</p>
    </section>
    <section><h3>Media workspace</h3>
      <MediaWorkspace title="New releases" {releases} {query} {selection} onQueryChange={(next) => query = next} onSelectionChange={(next) => selection = next} onQueuePreview={(ids) => queued = ids} />
      <p aria-live="polite">Queue preview: {queued.join(', ') || 'none'}</p>
    </section>
  </div>
</DocPage>

<style>
  .workspace-demo { display: grid; gap: 2rem; min-width: 0; }
  section { min-width: 0; }
  h3 { margin: 0 0 .75rem; color: var(--tint-ink); font-size: .95rem; }
  p { margin: .6rem 0 0; color: var(--tint-muted); font-size: .8rem; }
</style>
