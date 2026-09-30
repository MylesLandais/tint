<script lang="ts">
  import type { BoardCard as BoardCardModel } from '../../../core/board'
  import BoardLayout from './BoardLayout.svelte'

  let {
    onSelect, onAction,
  }: {
    onSelect: (id: string) => void
    onAction: (id: string) => void
  } = $props()

  const cards: BoardCardModel[] = [
    { id: 'a', title: 'Alpha', laneId: 'now', kind: 'graph', preview: { kicker: 'Preview A' } },
    { id: 'b', title: 'Beta', laneId: 'next', kind: 'task', preview: {} },
  ]
  const lanes = [{ id: 'now', label: 'Now' }, { id: 'next', label: 'Next' }]
</script>

{#snippet renderActions(card: BoardCardModel)}
  <button type="button" aria-label={`More ${card.title}`} onclick={() => onAction(card.id)}>More</button>
{/snippet}
{#snippet renderPreview(card: BoardCardModel)}
  <p>custom {card.title}</p>
{/snippet}

<BoardLayout {cards} {lanes} variant="kanban" selectedId="a" {onSelect} {renderActions} {renderPreview} />
