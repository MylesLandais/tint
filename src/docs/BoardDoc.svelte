<script lang="ts">
  import { BoardDetail, BoardLayout, BoardLayoutToggle, type BoardCardModel, type BoardLane, type BoardLayoutVariant } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const lanes: BoardLane[] = [
    { id: 'ideas', label: 'Ideas' },
    { id: 'doing', label: 'In progress' },
    { id: 'done', label: 'Done' },
  ]
  const cards: BoardCardModel[] = [
    { id: 'graph', title: 'Relationship map', laneId: 'ideas', kind: 'graph', preview: { kicker: '12 nodes · 18 edges', metrics: ['graph', 'draft'] } },
    { id: 'mix', title: 'Night Drive mix', laneId: 'doing', kind: 'media', preview: { kicker: '42 min audio', metrics: ['mix'] } },
    { id: 'task', title: 'Review metadata', laneId: 'doing', kind: 'task', preview: { kicker: 'Before publishing' } },
    { id: 'table', title: 'Track inventory', laneId: 'done', kind: 'table', preview: { kicker: '128 rows', metrics: ['ready'] } },
  ]
  let variant = $state<BoardLayoutVariant>('masonry')
  let selectedId = $state<string | null>(null)
  let selected = $derived(cards.find((card) => card.id === selectedId) ?? null)

  const api: ApiRow[] = [
    { prop: 'BoardLayout.cards / lanes', type: 'readonly BoardCard[] / readonly BoardLane[]', description: 'Host-owned cards and lane definitions.' },
    { prop: 'variant', type: 'masonry | kanban', description: 'Masonry source order or lane-grouped board.' },
    { prop: 'selectedId / onSelect', type: 'string | null / (cardId) => void', description: 'Controlled card selection.' },
    { prop: 'renderPreview / renderActions', type: 'Snippet<[BoardCard]>', description: 'Optional host content inside each card.' },
    { prop: 'BoardDetail.card', type: 'BoardCard | null', description: 'Selected card or an empty detail state.' },
    { prop: 'BoardLayoutToggle.value / onChange', type: 'BoardLayoutVariant / (variant) => void', description: 'Controlled layout switch.' },
    { prop: 'applyBoardCommand', type: 'BoardDocument × BoardCommand → BoardDocument', description: 'Pure immutable board command reducer.' },
  ]
  const usage = `import { BoardLayout, BoardLayoutToggle, BoardDetail } from '@nebula/tint/board'

let variant = $state<'masonry' | 'kanban'>('masonry')
let selectedId = $state<string | null>(null)

<BoardLayoutToggle value={variant} onChange={(next) => variant = next} />
<BoardLayout {cards} {lanes} {variant} {selectedId}
  onSelect={(cardId) => selectedId = cardId} />
<BoardDetail card={cards.find((card) => card.id === selectedId) ?? null} />`
</script>

<DocPage title="Board" description="A controlled board over plain TypeScript documents and commands. Cards can appear in source-order masonry or grouped lanes while the host owns selection and edits." importPath="@nebula/tint/board" {usage} {api} accessibility="The layout toggle exposes pressed state. Each card remains an article, with a native title button for keyboard selection and aria-pressed; nested actions remain independently operable. Kanban lanes and cards have named sections and lists, and selected cards have a visible outline.">
  <div class="board-demo">
    <BoardLayoutToggle value={variant} onChange={(next) => variant = next} />
    <BoardLayout {cards} {lanes} {variant} {selectedId} onSelect={(cardId) => selectedId = cardId} label="Demo board" />
    <BoardDetail card={selected}><p class="detail-copy">{selected?.preview.kicker}</p></BoardDetail>
    <p class="summary" aria-live="polite">Layout: {variant} · Selected: {selected?.title ?? 'none'}</p>
  </div>
</DocPage>

<style>
  .board-demo { display: grid; gap: 1rem; min-width: 0; }
  .detail-copy { margin: 0; padding: 1rem; color: var(--tint-muted); }
  .summary { margin: 0; color: var(--tint-muted); font-size: .85rem; }
</style>
