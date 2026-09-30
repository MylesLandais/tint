<script lang="ts">
  import { observeAudioStore } from '../audio-engine/bindings'
  import AnalysisQueue from '../dj/AnalysisQueue.svelte'
  import ImportTracksDialog from '../dj/ImportTracksDialog.svelte'
  import type { TrackImportControllerProps } from './types'

  let { open, store, onClose }: TrackImportControllerProps = $props()
  let observed = $derived(observeAudioStore(store))
  let snapshot = $derived(observed.snapshot)

  async function importTracks() {
    await store.importSelected()
    if (store.getSnapshot().state === 'ready') onClose()
  }
</script>

<div class="space-y-4">
  <ImportTracksDialog {open} selectedFiles={snapshot.selectedFiles} busy={snapshot.state === 'importing'} error={snapshot.error}
    onFilesSelected={store.selectFiles} onImport={() => { void importTracks() }} {onClose} />
  {#if snapshot.items.length}
    <AnalysisQueue items={snapshot.items} onRetry={() => { void store.importSelected() }} />
  {/if}
</div>
