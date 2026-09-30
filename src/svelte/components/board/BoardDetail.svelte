<script lang="ts">
  import { boardKindLabel } from '../../../core/board'
  import type { BoardDetailProps } from './types'

  let { card, children, empty, class: className, ...rest }: BoardDetailProps = $props()
</script>

{#if card}
  <section {...rest} data-tint-board-detail="" data-kind={card.kind} class={['board-detail', className].filter(Boolean).join(' ')}>
    <header>
      <div class="heading">
        <p class="kind">{boardKindLabel(card.kind)}</p>
        <h2 class:task={card.kind === 'task'}>{card.title}</h2>
      </div>
    </header>
    <div data-tint-board-detail-body="" class="body">{@render children?.()}</div>
  </section>
{:else}
  <section {...rest} data-tint-board-detail="" data-empty="" class={['board-detail', 'empty', className].filter(Boolean).join(' ')}>
    {#if typeof empty === 'string'}{empty}{:else if empty}{@render empty()}{:else}Select a card to open its live surface.{/if}
  </section>
{/if}

<style>
  .board-detail { display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); box-shadow: 0 1px 2px var(--tint-shadow-color); }
  .board-detail.empty { min-height: 12rem; align-items: center; justify-content: center; border-style: dashed; background: var(--tint-surface); padding: var(--tint-space-6) var(--tint-space-4); color: var(--tint-muted); font-size: var(--tint-font-size-sm); text-align: center; box-shadow: none; }
  header { display: flex; align-items: center; justify-content: space-between; gap: var(--tint-space-2); border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); padding: var(--tint-space-2) var(--tint-space-3); }
  .heading { min-width: 0; }
  .kind { margin: 0; color: var(--tint-muted); font-size: 0.625rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
  h2 { margin: 0.125rem 0 0; overflow: hidden; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  h2.task { overflow-wrap: anywhere; white-space: normal; }
  .body { min-height: 0; flex: 1; overflow: auto; }
</style>
