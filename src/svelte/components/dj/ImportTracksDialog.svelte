<script lang="ts">
  import Dialog from '../dialog/Dialog.svelte'
  import type { ImportTracksDialogProps } from './types'

  let { open, selectedFiles, onFilesSelected, onImport, onClose, busy = false, error }: ImportTracksDialogProps = $props()
</script>

<Dialog {open} onOpenChange={(next) => { if (!next) onClose() }} title="Import local tracks"
  description="Audio stays in this browser and is not uploaded.">
  <div class="space-y-4">
    <label class="mt-4 block rounded-lg border border-dashed border-tint-border p-4 text-sm">
      <span class="font-medium">Choose audio files</span>
      <input class="mt-2 block w-full text-sm" type="file" multiple accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.opus"
        disabled={busy} onchange={(event) => onFilesSelected(Array.from(event.currentTarget.files ?? []))} />
    </label>
    {#if selectedFiles.length}
      <ul aria-label="Selected tracks" class="mt-3 space-y-1 text-sm">
        {#each selectedFiles as file (`${file.name}-${file.size}`)}<li>{file.name}</li>{/each}
      </ul>
    {/if}
    {#if error}<p role="alert" class="mt-3 text-sm text-tint-danger">{error}</p>{/if}
    <div class="mt-4 flex gap-2">
      <button type="button" disabled={busy || selectedFiles.length === 0} onclick={onImport}
        class="rounded-md bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent disabled:opacity-50">{busy ? 'Importing tracks' : 'Import tracks'}</button>
      <button type="button" disabled={busy} onclick={onClose}
        class="rounded-md border border-tint-border px-3 py-2 text-sm font-medium disabled:opacity-50">Cancel import</button>
    </div>
  </div>
</Dialog>
