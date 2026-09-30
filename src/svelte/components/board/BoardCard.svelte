<script lang="ts">
  import { boardKindLabel } from '../../../core/board'
  import Badge from '../badge/Badge.svelte'
  import type { BoardCardProps } from './types'

  let { card, selected = false, onSelect, children, actions, class: className, ...rest }: BoardCardProps = $props()

  function selectFromClick(event: MouseEvent) {
    if (!onSelect) return
    const target = event.target
    const current = event.currentTarget
    if (target instanceof Element && current instanceof Element && target !== current) {
      const control = target.closest('button, a[href], input, select, textarea, [role="button"]')
      if (control && control !== current && current.contains(control)) return
    }
    onSelect(card.id)
  }

</script>

<!-- Pointer selection covers the card; the title is a native keyboard selection button. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article
  {...rest}
  data-tint-board-card=""
  data-kind={card.kind}
  data-selected={selected || undefined}
  class={['board-card', className].filter(Boolean).join(' ')}
  class:interactive={Boolean(onSelect)}
  onclick={selectFromClick}
>
  <header>
    <div class="heading">
      <p class="kind">{boardKindLabel(card.kind)}</p>
      <h3 class:task={card.kind === 'task'}>{#if onSelect}<button type="button" class="select" aria-pressed={selected} onclick={() => onSelect?.(card.id)}>{card.title}</button>{:else}{card.title}{/if}</h3>
    </div>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </header>
  {#if card.preview.posterUrl}
    <div class="poster"><img src={card.preview.posterUrl} alt="" /></div>
  {/if}
  <div class="body">
    {#if card.preview.kicker}<p class="kicker">{card.preview.kicker}</p>{/if}
    {#if card.preview.metrics?.length}
      <div class="metrics">{#each card.preview.metrics as metric, index (`${metric}-${index}`)}<Badge tone="neutral">{metric}</Badge>{/each}</div>
    {/if}
    {@render children?.()}
  </div>
</article>

<style>
  .board-card { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); text-align: left; box-shadow: 0 1px 2px var(--tint-shadow-color); }
  .board-card.interactive { cursor: pointer; }
  .board-card.interactive:hover { background: var(--tint-surface); }
  .select { width: 100%; border: 0; background: none; padding: 0; color: inherit; cursor: pointer; font: inherit; text-align: inherit; }
  .select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .board-card[data-selected] { box-shadow: 0 0 0 2px var(--tint-focus); }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tint-space-2); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-3); }
  .heading { min-width: 0; }
  .kind { margin: 0; color: var(--tint-muted); font-size: 0.625rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
  h3 { margin: var(--tint-space-1) 0 0; overflow: hidden; color: var(--tint-ink); font-size: var(--tint-font-size-sm); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  h3.task { font-weight: 500; overflow-wrap: anywhere; white-space: normal; }
  .actions { flex: none; }
  .poster { aspect-ratio: 16 / 9; width: 100%; overflow: hidden; background: var(--tint-surface); }
  .poster img { width: 100%; height: 100%; object-fit: cover; }
  .body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: var(--tint-space-2); padding: var(--tint-space-2) var(--tint-space-3); }
  .kicker { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .metrics { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); }
</style>
