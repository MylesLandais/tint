<script lang="ts">
  import type { FieldDef } from '../../../core/table'

  type Props = { field: FieldDef; value: unknown }
  let { field, value }: Props = $props()

  const blank = $derived(value == null || value === '' || (Array.isArray(value) && value.length === 0))
  const optionLabel = (v: unknown) => field.options?.find((o) => o.value === String(v))?.label ?? String(v)
  const list = $derived(Array.isArray(value) ? value.map(String) : [])
  const stars = $derived(Math.max(0, Math.min(5, Number(value) || 0)))
  const host = $derived.by(() => {
    try { const u = new URL(String(value)); return u.host + (u.pathname === '/' ? '' : u.pathname) }
    catch { return String(value) }
  })
</script>

{#if field.type === 'rating'}
  <span class="stars" data-empty={stars === 0 || undefined} role="img" aria-label={stars ? `${stars} of 5` : 'No rating'}>{#each [1, 2, 3, 4, 5] as n (n)}<span data-star={n} class:off={n > stars}>★</span>{/each}</span>
{:else if field.type === 'checkbox'}
  <span class="check" data-on={value === true} role="img" aria-label={value === true ? 'Checked' : 'Unchecked'}>
    {#if value === true}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3 5 8.8l4.5-5.2" /></svg>{/if}
  </span>
{:else if blank}
  <span class="empty" aria-hidden="true"></span>
{:else if field.type === 'number'}
  <span class="num">{value}</span>
{:else if field.type === 'select' || field.type === 'linked-record'}
  <span class="chip" data-kind={field.type}>{optionLabel(value)}</span>
{:else if field.type === 'multi-select'}
  <span class="chips">{#each list as item (item)}<span class="chip">{item}</span>{/each}</span>
{:else if field.type === 'url'}
  <a href={String(value)} target="_blank" rel="noopener noreferrer" tabindex="-1" onclick={(e) => e.stopPropagation()}>{host}</a>
{:else if field.type === 'date'}
  <span class="date">{value}</span>
{:else}
  <span class="text">{value}</span>
{/if}

<style>
  .text, .date, .num, a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .text { white-space: inherit; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--ds-lines, 1); line-clamp: var(--ds-lines, 1); white-space: normal; }
  .num, .date { font-family: var(--tint-font-mono, ui-monospace, monospace); font-variant-numeric: tabular-nums; }
  .num { margin-inline-start: auto; }
  a { color: var(--tint-accent); text-decoration: underline; text-underline-offset: 2px; }
  .chips { display: flex; gap: .25rem; overflow: hidden; flex-wrap: var(--ds-chip-wrap, nowrap); }
  .chip {
    padding: 0 .5rem; border-radius: 999px; background: var(--tint-accent-soft); color: var(--tint-ink);
    font-size: var(--tint-font-size-xs); line-height: 1.5rem; white-space: nowrap; flex: none;
  }
  .chip[data-kind='linked-record'] { background: transparent; border: 1px solid var(--tint-border-strong); line-height: 1.375rem; }
  .stars { display: inline-flex; color: var(--tint-accent); font-size: .95rem; cursor: pointer; }
  .stars span { padding: 0 .0625rem; }
  .stars .off { color: var(--tint-border-strong); }
  /* Hover previews the rating a click would set: fill up to the hovered star. */
  .stars:hover span { color: var(--tint-accent); }
  .stars:hover span:hover ~ span { color: var(--tint-border-strong); }
  .stars[data-empty] { opacity: 0; }
  :global(.td:hover) .stars[data-empty], :global(.td.active) .stars[data-empty] { opacity: 1; }
  .check {
    display: inline-grid; place-items: center; width: 1rem; height: 1rem; border-radius: 3px;
    border: 1.5px solid var(--tint-border-strong); background: var(--tint-panel);
  }
  .check[data-on='true'] { background: var(--tint-accent); border-color: var(--tint-accent); }
  .check svg { width: .75rem; height: .75rem; fill: none; stroke: var(--tint-on-accent, #fff); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
