<script lang="ts">
  import { filterCharacterLibrary, type CharacterLibraryItem } from '../../../core/character-card/document'
  import Avatar from '../identity/Avatar.svelte'
  import './library.css'

  type Props = {
    items: readonly CharacterLibraryItem[]
    query: string
    onQueryChange: (query: string) => void
    onSelect: (id: string) => void
    onStartChat: (id: string) => void
    onCreate: () => void
    selectedId?: string | null
    busy?: boolean
  }

  let {
    items, query, onQueryChange, onSelect, onStartChat, onCreate,
    selectedId = null, busy = false,
  }: Props = $props()
  let visible = $derived(filterCharacterLibrary(items, query))
</script>

<section class="tint-character-library" aria-label="Character library" aria-busy={busy}>
  <header class="tint-character-library-toolbar">
    <label>Search characters
      <input type="search" value={query} oninput={(event) => onQueryChange(event.currentTarget.value)} placeholder="Name or tag" />
    </label>
    <button type="button" onclick={onCreate} disabled={busy}>New character</button>
  </header>
  <p class="tint-character-library-count" role="status">{visible.length} {visible.length === 1 ? 'character' : 'characters'}</p>
  {#if visible.length === 0}
    <p>{items.length ? 'No characters match your search.' : 'Create a character or import a card to begin.'}</p>
  {/if}
  <ul class="tint-character-library-grid">
    {#each visible as item (item.id)}
      <li data-selected={item.id === selectedId ? 'true' : undefined} aria-current={item.id === selectedId ? 'true' : undefined}>
        <div class="tint-character-library-identity">
          <Avatar name={item.name} src={item.imageUrl} size="lg" decorative />
          <h3>{item.name}</h3>
          {#if item.id === selectedId}<span class="tint-character-library-selected">Selected</span>{/if}
        </div>
        {#if item.description}<p>{item.description}</p>{/if}
        <div class="tint-character-library-tags">
          {#each item.tags as tag, index (`${tag}:${index}`)}<span>{tag}</span>{/each}
        </div>
        <div class="tint-character-library-actions">
          <button type="button" onclick={() => onStartChat(item.id)} disabled={busy} aria-label={`Chat with ${item.name}`}>Start chat</button>
          <button type="button" onclick={() => onSelect(item.id)} disabled={busy} aria-label={`Edit ${item.name}`}>Edit</button>
        </div>
      </li>
    {/each}
  </ul>
</section>
