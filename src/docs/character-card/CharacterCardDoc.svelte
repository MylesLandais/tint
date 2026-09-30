<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    bytesFromObjectUrl, embedTavernCard, emptyTavernCard, extractTavernCard,
    parseTavernCardJson, serializeTavernCard, type TavernCardV2,
  } from '../../components/character-card'
  import type { FormFileValue } from '../../components/form/contracts/values'
  import CharacterCardEditorForm from '../../svelte/components/character-card/CharacterCardEditorForm.svelte'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  function exampleCard(): TavernCardV2 {
    const next = emptyTavernCard()
    next.data.name = 'Aiko'
    next.data.description = 'A late-night barista with a pen tucked behind one ear.'
    next.data.personality = 'Sarcastic, quietly protective of regulars.'
    next.data.scenario = '{{user}} arrives just before closing.'
    next.data.first_mes = 'We close in ten. Sit down before you fall down.'
    next.data.tags = ['original', 'slice-of-life']
    next.data.creator = 'tint'
    next.data.character_version = '1.0'
    return next
  }

  let card = $state<TavernCardV2>(exampleCard())
  let avatar = $state<FormFileValue | null>(null)
  let message = $state('')
  let jsonInput = $state<HTMLInputElement>()
  let pngInput = $state<HTMLInputElement>()

  onDestroy(() => { if (avatar?.objectUrl) URL.revokeObjectURL(avatar.objectUrl) })

  function download(filename: string, bytes: string | Uint8Array, type: string) {
    const data = typeof bytes === 'string' ? bytes : Uint8Array.from(bytes).buffer as ArrayBuffer
    const url = URL.createObjectURL(new Blob([data], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      card = parseTavernCardJson(await file.text())
      message = `Imported ${file.name}`
    } catch (cause) {
      message = cause instanceof Error ? cause.message : 'Could not read JSON.'
    }
    input.value = ''
  }

  async function importPng(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      card = extractTavernCard(bytes)
      if (avatar?.objectUrl) URL.revokeObjectURL(avatar.objectUrl)
      avatar = { name: file.name, mimeType: file.type || 'image/png', objectUrl: URL.createObjectURL(file) }
      message = `Imported ${file.name}`
    } catch (cause) {
      message = cause instanceof Error ? cause.message : 'Could not read PNG.'
    }
    input.value = ''
  }

  async function exportPng() {
    try {
      const bytes = avatar?.objectUrl
        ? embedTavernCard(card, await bytesFromObjectUrl(avatar.objectUrl))
        : embedTavernCard(card)
      download(`${card.data.name || 'character'}.png`, bytes, 'image/png')
    } catch (cause) {
      message = cause instanceof Error ? cause.message : 'Could not export PNG.'
    }
  }

  const api: ApiRow[] = [
    { prop: 'value / onValueChange', type: 'TavernCardV2 / (card) => void', description: 'Controlled card value; unknown extension keys survive edits and round trips.' },
    { prop: 'avatar / onAvatarChange', type: 'FormFileValue | null / (file) => void', description: 'Optional portrait for PNG export, separate from V2 JSON.' },
    { prop: 'busy / error', type: 'boolean / string | Snippet', description: 'Host-controlled submit state and form-level alert.' },
    { prop: 'submitLabel / submittingLabel / hideSubmit', type: 'string / string / boolean', description: 'Save action copy or toolbar-owned save.' },
    { prop: 'transport / onSubmit', type: 'FormTransport / (envelope) => void', description: 'Optional persistence seam and validated submission envelope.' },
    { prop: 'parseTavernCardJson / serializeTavernCard', type: 'string ↔ TavernCardV2', description: 'Framework-neutral JSON import and export.' },
    { prop: 'extractTavernCard / embedTavernCard', type: 'PNG bytes ↔ TavernCardV2', description: 'Framework-neutral PNG metadata round trip.' },
  ]
  const usage = `import { CharacterCardEditorForm } from '@nebula/tint/character-card'
import { emptyTavernCard, serializeTavernCard } from '@nebula/tint/character-card'

let card = $state(emptyTavernCard())

<CharacterCardEditorForm value={card}
  onValueChange={(next) => card = next}
  onSubmit={(envelope) => save(envelope.values)} />

const json = serializeTavernCard(card)`
</script>

<DocPage title="Character Card" description="Edit a Character Card V2 with the shared form schema, then import or export JSON and PNG. Unknown extension data survives the round trip." importPath="@nebula/tint/character-card" {usage} {api} accessibility="The editor uses labelled fields and announces validation and import errors. All actions are keyboard accessible. Import controls have accessible file input labels, and the host owns the card and avatar values.">
  <div class="toolbar">
    <button type="button" onclick={() => jsonInput?.click()}>Import JSON</button>
    <button type="button" onclick={() => download(`${card.data.name || 'character'}.json`, serializeTavernCard(card), 'application/json')}>Export JSON</button>
    <button type="button" onclick={() => pngInput?.click()}>Import PNG</button>
    <button type="button" onclick={() => void exportPng()}>Export PNG</button>
    <input bind:this={jsonInput} class="visually-hidden" type="file" accept=".json,application/json" aria-label="Choose character JSON" onchange={importJson} />
    <input bind:this={pngInput} class="visually-hidden" type="file" accept=".png,image/png" aria-label="Choose character PNG" onchange={importPng} />
  </div>
  {#if message}<p class="message" role="status">{message}</p>{/if}
  <CharacterCardEditorForm value={card} onValueChange={(next) => card = next} {avatar} onAvatarChange={(next) => avatar = next} onSubmit={() => { message = 'Saved in memory. Export JSON or PNG to take it with you.' }} />
</DocPage>

<style>
  .toolbar { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
  button { min-height: 2.5rem; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); padding: .5rem .8rem; background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: .84rem; }
  button:hover { background: var(--tint-surface); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .message { color: var(--tint-muted); font-size: .84rem; }
</style>
