<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { BoardCard as BoardCardModel } from '../../../core/board'
  import BoardCard from './BoardCard.svelte'

  let {
    card, selected, onSelect, renderActions, renderPreview,
  }: {
    card: BoardCardModel
    selected: boolean
    onSelect?: (cardId: string) => void
    renderActions?: Snippet<[BoardCardModel]>
    renderPreview?: Snippet<[BoardCardModel]>
  } = $props()
</script>

{#snippet actions()}{@render renderActions?.(card)}{/snippet}

<BoardCard {card} {selected} {onSelect} actions={renderActions ? actions : undefined}>
  {@render renderPreview?.(card)}
</BoardCard>
