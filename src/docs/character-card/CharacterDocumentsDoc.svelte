<script lang="ts">
  import {
    CharacterDocumentEditor,
    CharacterLibrary,
    type CharacterDocument,
    type CharacterLibraryItem,
  } from '../../svelte/components/character-card'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  const items: CharacterLibraryItem[] = [
    { id: 'aster', name: 'Aster', tags: ['archive', 'scholar'], description: 'A keeper of old stories.' },
    { id: 'marin', name: 'Marin', tags: ['sea', 'navigator'], description: 'A navigator who knows every current.' },
  ]
  const documents: Record<string, CharacterDocument> = {
    aster: { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'Aster', description: 'A keeper of old stories.' }, future_envelope: { preserved: true } },
    marin: { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'Marin', description: 'A navigator who knows every current.' } },
  }

  let query = $state('')
  let selectedId = $state<string | null>('aster')
  let document = $state<CharacterDocument>(documents.aster!)
  let message = $state('')

  function select(id: string) {
    selectedId = id
    document = documents[id]!
    message = ''
  }

  const api: ApiRow[] = [
    { prop: 'CharacterLibrary items / query', type: 'CharacterLibraryItem[] / string', description: 'Host-owned catalog and search input. Filtering matches names, tags, and descriptions.' },
    { prop: 'onQueryChange / onSelect / onStartChat / onCreate', type: 'callbacks', description: 'The host handles query, navigation, chat routing, and creation by stable ID.' },
    { prop: 'selectedId / busy', type: 'string | null / boolean', description: 'Controlled selection and disabled action state.' },
    { prop: 'CharacterDocumentEditor value / onValueChange', type: 'CharacterDocument / callback', description: 'Controlled original V2 or V3 document. Edits keep unknown keys and flattened documents intact.' },
    { prop: 'onSubmit / busy / error', type: 'callback / boolean / string', description: 'Host-owned save action and operation feedback.' },
  ]
  const usage = `import { CharacterLibrary, CharacterDocumentEditor } from '@nebula/tint/character-card'

<CharacterLibrary {items} {query} onQueryChange={(next) => query = next}
  onSelect={select} onStartChat={startChat} onCreate={createCharacter} />

<CharacterDocumentEditor value={document}
  onValueChange={(next) => document = next}
  onSubmit={(next) => saveOriginalDocument(next)} />`
</script>

<DocPage title="Character Documents" description="Browse characters and edit the original V2 or V3 payload. The catalog and document stay under host control, including unknown extension fields." importPath="@nebula/tint/character-card" {usage} {api} accessibility="The library announces the filtered count, labels search and actions, and uses stable item IDs. Editor sections expose pressed state and the form labels each field and reports validation or save errors.">
  <div class="demo">
    <CharacterLibrary
      {items}
      {query}
      onQueryChange={(next) => query = next}
      onSelect={select}
      onStartChat={(id) => message = `Start chat with ${items.find((item) => item.id === id)?.name ?? id}`}
      onCreate={() => { selectedId = null; document = { spec: 'chara_card_v3', spec_version: '3.0', data: { name: '' } }; message = 'New character draft.' }}
      {selectedId}
    />
    <CharacterDocumentEditor value={document} onValueChange={(next) => document = next} onSubmit={(next) => { document = next; message = `Saved ${String(next.data?.name ?? next.name ?? 'character')} in memory.` }} />
    {#if message}<p role="status">{message}</p>{/if}
  </div>
</DocPage>

<style>
  .demo { display: grid; gap: 1.5rem; }
</style>
