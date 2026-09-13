import './library.css'
import { Avatar } from '../identity'

export type CharacterLibraryItem = {
  id: string
  name: string
  tags: readonly string[]
  description?: string
  imageUrl?: string
}

export type CharacterLibraryProps = {
  items: readonly CharacterLibraryItem[]
  query: string
  onQueryChange: (query: string) => void
  onSelect: (id: string) => void
  onStartChat: (id: string) => void
  onCreate: () => void
  selectedId?: string | null
  busy?: boolean
}

/** Controlled catalog. The host owns documents, persistence, and chat routing. */
export function CharacterLibrary({ items, query, onQueryChange, onSelect, onStartChat, onCreate, selectedId, busy }: CharacterLibraryProps) {
  const search = query.trim().toLocaleLowerCase()
  const visible = items.filter(item => [item.name, ...item.tags, item.description ?? ''].join(' ').toLocaleLowerCase().includes(search))
  return <section className="tint-character-library" aria-label="Character library" aria-busy={busy}>
    <header className="tint-character-library-toolbar">
      <label>Search characters<input type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Name or tag" /></label>
      <button type="button" onClick={onCreate} disabled={busy}>New character</button>
    </header>
    <p className="tint-character-library-count" role="status">{visible.length} {visible.length === 1 ? 'character' : 'characters'}</p>
    {visible.length === 0 ? <p>{items.length ? 'No characters match your search.' : 'Create a character or import a card to begin.'}</p> : null}
    <ul className="tint-character-library-grid">
      {visible.map(item => <li key={item.id} data-selected={item.id === selectedId || undefined}>
        <div className="tint-character-library-identity">
          <Avatar name={item.name} src={item.imageUrl} size="lg" decorative />
          <h3>{item.name}</h3>
        </div>
        {item.description ? <p>{item.description}</p> : null}
        <div className="tint-character-library-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="tint-character-library-actions">
          <button type="button" onClick={() => onStartChat(item.id)} disabled={busy} aria-label={`Chat with ${item.name}`}>Start chat</button>
          <button type="button" onClick={() => onSelect(item.id)} disabled={busy} aria-label={`Edit ${item.name}`}>Edit</button>
        </div>
      </li>)}
    </ul>
  </section>
}
