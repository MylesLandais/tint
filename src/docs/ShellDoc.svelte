<script lang="ts">
  import {
    CommandPalette, StatusBar, WorkspaceHeader, WorkspaceSplit, WorkspaceTabs,
    type CommandPaletteItem, type WorkspaceTab,
  } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const tabs: WorkspaceTab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
  ]
  const commands: CommandPaletteItem[] = [
    { id: 'open', label: 'Open collection', description: 'View the current collection' },
    { id: 'share', label: 'Share collection', description: 'Copy an invitation' },
  ]
  let tab = $state('overview')
  let splitSize = $state(230)
  let paletteOpen = $state(false)
  let query = $state('')
  let action = $state('none')
  const api: ApiRow[] = [
    { prop: 'AppShell', type: 'nav / header / aside / status / children', description: 'Container-aware application frame with rail or top navigation.' },
    { prop: 'NavRail / ResponsiveNavRail / TopNav', type: 'groups / activeId / callbacks', description: 'Host-supplied navigation with compact and drawer presentations.' },
    { prop: 'NavRail context', type: 'Snippet', description: 'A contextual view, such as a page thread list, shown in place of the groups while the rail is expanded; also rendered in the ResponsiveNavRail drawer. The host supplies its own way back.' },
    { prop: 'WorkspaceHeader', type: 'title / subtitle / breadcrumbs / actions', description: 'Workspace heading and action slot.' },
    { prop: 'WorkspaceTabs', type: 'tabs / value / onChange / label', description: 'Controlled tab navigation with arrow, Home, and End keys.' },
    { prop: 'WorkspaceSplit', type: 'size / onSizeChange / first / second', description: 'Host-owned pane size with keyboard and pointer resizing.' },
    { prop: 'CommandPalette', type: 'open / query / items / onSelect', description: 'Controlled searchable command dialog.' },
    { prop: 'StatusBar', type: 'items / connection', description: 'Readable application state and connection copy.' },
  ]
  const usage = `import { WorkspaceHeader, WorkspaceSplit, WorkspaceTabs } from '@nebula/tint/shell'

let selected = $state('overview')
let inspectorWidth = $state(240)

<WorkspaceHeader title="Collection" subtitle="12 tracks" />
<WorkspaceTabs tabs={tabs} value={selected}
  onChange={(id) => selected = id} label="Collection views" />

{#snippet main()}<p>Collection rows</p>{/snippet}
{#snippet inspector()}<p>Inspector</p>{/snippet}
<WorkspaceSplit size={inspectorWidth}
  onSizeChange={(size) => inspectorWidth = size}
  first={main} second={inspector} label="Resize inspector" />`
</script>

{#snippet first()}
  <div class="pane"><strong>{tab === 'overview' ? 'Collection overview' : 'Recent activity'}</strong><p>Move the separator with arrow keys.</p></div>
{/snippet}

{#snippet second()}
  <div class="pane"><strong>Inspector</strong><p>Width: {splitSize}px</p></div>
{/snippet}

<DocPage title="Shell and Workspace" description="Responsive app chrome, controlled workspace navigation, pane sizing, and command search. State stays with the host." importPath="@nebula/tint/shell" {usage} {api} accessibility="Workspace tabs use tablist, tab, and tabpanel roles. The split separator reports its value and responds to keyboard arrows, Home, and End. CommandPalette is a labelled modal dialog with focus handling, listbox navigation, and Escape dismissal. Status copy remains readable without color.">
  <div class="shell-demo">
    <WorkspaceHeader title="Collection" subtitle="12 tracks" breadcrumbs={[{ label: 'Library', href: '#/components/table' }, { label: 'Collection' }]} />
    <WorkspaceTabs {tabs} value={tab} onChange={(next) => tab = next} label="Collection views" />
    <WorkspaceSplit size={splitSize} minSize={140} maxSize={350} onSizeChange={(next) => splitSize = next} label="Resize inspector" {first} {second} />
    <StatusBar items={[{ id: 'saved', label: 'Saved', tone: 'success' }]} connection={{ state: 'connected', label: 'Connected' }} />
  </div>
  <div class="command-demo">
    <button type="button" onclick={() => paletteOpen = true}>Open command palette</button>
    <span aria-live="polite">Selected command: {action}</span>
  </div>
  <CommandPalette open={paletteOpen} onOpenChange={(next) => paletteOpen = next} {query} onQueryChange={(next) => query = next} items={commands} onSelect={(id) => action = id} />
</DocPage>

<style>
  .shell-demo { display: grid; grid-template-rows: auto auto minmax(13rem, 1fr) auto; height: 24rem; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  .pane { padding: 1rem; color: var(--tint-ink); }
  .pane p { color: var(--tint-muted); font-size: .8rem; }
  .command-demo { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; color: var(--tint-muted); font-size: .84rem; }
  .command-demo button { min-height: 2.5rem; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: .5rem .8rem; background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; font: inherit; }
  .command-demo button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
