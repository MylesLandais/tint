<script lang="ts">
  import type { BoardCard as BoardCardModel } from '../../../core/board'
  import { cardsForLane } from '../../../core/board'
  import DataMasonry from '../table/DataMasonry.svelte'
  import BoardCardView from './BoardCardView.svelte'
  import type { BoardLayoutProps } from './types'

  let {
    cards, lanes, variant = 'masonry', selectedId = null, onSelect,
    renderActions, renderPreview, empty, density = 'auto', targetWidth = 320,
    gap = 12, label = 'Board', class: className, ...rest
  }: BoardLayoutProps = $props()
</script>

{#snippet renderOne(card: BoardCardModel)}
  <BoardCardView {card} selected={selectedId === card.id} {onSelect} {renderActions} {renderPreview} />
{/snippet}
{#snippet emptyState()}
  {#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{:else}No cards on this board.{/if}
{/snippet}

<div
  {...rest}
  data-tint-board-layout=""
  data-variant={variant}
  class={['board-layout', className].filter(Boolean).join(' ')}
  class:kanban={variant === 'kanban'}
  class:empty={variant === 'masonry' && cards.length === 0}
>
  {#if variant === 'kanban'}
    {#each lanes as lane (lane.id)}
      {@const laneCards = cardsForLane({ cards }, lane.id)}
      <section data-tint-board-lane="" data-lane-id={lane.id} aria-label={lane.label} class="lane">
        <header><h3>{lane.label}</h3><span>{laneCards.length}</span></header>
        <div class="lane-cards" role="list" aria-label={`${lane.label} cards`}>
          {#if laneCards.length === 0}<p class="empty-lane">Empty</p>{/if}
          {#each laneCards as card (card.id)}
            <div role="listitem">{@render renderOne(card)}</div>
          {/each}
        </div>
      </section>
    {/each}
  {:else if cards.length === 0}
    {@render emptyState()}
  {:else}
    <DataMasonry rows={cards} rowId="id" {density} {targetWidth} {gap} {label} renderItem={renderOne} emptyState={emptyState} />
  {/if}
</div>

<style>
  .board-layout { container-type: inline-size; min-width: 0; }
  .board-layout.empty { color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .board-layout.kanban { display: flex; gap: var(--tint-space-3); overflow-x: auto; padding-bottom: var(--tint-space-1); }
  .lane { display: flex; width: 18rem; flex: none; flex-direction: column; gap: var(--tint-space-2); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-surface); padding: var(--tint-space-2); }
  .lane header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tint-space-2); padding: var(--tint-space-1); }
  .lane h3 { margin: 0; color: var(--tint-ink); font-size: var(--tint-font-size-xs); font-weight: 600; letter-spacing: 0.025em; text-transform: uppercase; }
  .lane header span { color: var(--tint-muted); font-family: ui-monospace, monospace; font-size: 0.6875rem; font-variant-numeric: tabular-nums; }
  .lane-cards { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-2); }
  .empty-lane { margin: 0; border: 1px dashed var(--tint-border); border-radius: var(--tint-radius-md); padding: var(--tint-space-6) var(--tint-space-3); color: var(--tint-muted); font-size: var(--tint-font-size-xs); text-align: center; }
  @container (max-width: 600px) { .lane { width: min(18rem, 90cqw); } }
</style>
