<script lang="ts">
  import { onDestroy } from 'svelte'
  import { AudioEngineProvider, Midnight128Workspace, createBrowserMidnight128Runtime } from '../../svelte'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'
  import EngineStatus from './EngineStatus.svelte'

  const runtime = createBrowserMidnight128Runtime()
  let importOpen = $state(true)
  onDestroy(() => { void runtime.dispose().catch(console.error) })

  const api: ApiRow[] = [
    { prop: 'createBrowserMidnight128Runtime', type: 'BrowserMidnight128Runtime', description: 'Plain TypeScript registry, track import store, and Web Audio engine store.' },
    { prop: 'AudioEngineProvider store', type: 'AudioEngineStore', description: 'Svelte context binding for reactive engine snapshots.' },
    { prop: 'Midnight128Workspace importStore / registry / engineStore', type: 'plain TypeScript stores', description: 'Host-owned track data and audition backend.' },
    { prop: 'importOpen / onCloseImport', type: 'boolean / callback', description: 'Controlled local track import dialog.' },
  ]
  const usage = `import { AudioEngineProvider } from '@nebula/tint/audio-engine'
import { Midnight128Workspace, createBrowserMidnight128Runtime } from '@nebula/tint/audio-workspace'

const runtime = createBrowserMidnight128Runtime()
let importOpen = $state(true)
<AudioEngineProvider store={runtime.engineStore}>
  <Midnight128Workspace {importOpen} importStore={runtime.importStore}
    registry={runtime.registry} engineStore={runtime.engineStore}
    onCloseImport={() => importOpen = false} />
</AudioEngineProvider>`
</script>

<DocPage title="Midnight 128 Workspace" description="Local audio import, analysis, a reference DJ set, and transition audition over the shared plain TypeScript Web Audio engine. Files stay in the browser." importPath="@nebula/tint/audio-workspace" {usage} {api} accessibility="The import dialog has a name, labeled file input, disabled import action until files are selected, and an error alert. Analysis and audition status use text announcements. Engine state is exposed through a scoped Svelte context provider.">
  <div class="workspace-demo">
    <AudioEngineProvider store={runtime.engineStore}>
      <EngineStatus />
      {#if !importOpen}<button type="button" class="open-import" onclick={() => importOpen = true}>Import reference tracks</button>{/if}
      <Midnight128Workspace {importOpen} importStore={runtime.importStore} registry={runtime.registry} engineStore={runtime.engineStore} onCloseImport={() => importOpen = false} />
    </AudioEngineProvider>
  </div>
</DocPage>

<style>
  .workspace-demo { display: grid; gap: 1rem; }
  .open-import { justify-self: start; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-accent); padding: .5rem .75rem; color: var(--tint-on-accent); cursor: pointer; font: inherit; font-size: .84rem; }
  .open-import:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
