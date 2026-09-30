<script lang="ts">
  type Props = {
    page: number
    pageSize: number
    total: number
    onChange: (page: number) => void
    label?: string
    class?: string
  }

  let { page, pageSize, total, onChange, label = 'Pagination', class: className }: Props = $props()
  let pageCount = $derived(Math.max(1, Math.ceil(total / Math.max(1, pageSize))))
  let clamped = $derived(Math.min(Math.max(0, page), pageCount - 1))
  let first = $derived(total === 0 ? 0 : clamped * pageSize + 1)
  let last = $derived(Math.min(total, (clamped + 1) * pageSize))
</script>

<nav aria-label={label} data-table-pager="" class={className}>
  <span aria-live="polite">{total === 0 ? 'No rows' : `${first}–${last} of ${total}`}</span>
  <span class="controls">
    <button type="button" onclick={() => onChange(clamped - 1)} disabled={clamped === 0} aria-label="Previous page">‹</button>
    <span class="count">{clamped + 1} / {pageCount}</span>
    <button type="button" onclick={() => onChange(clamped + 1)} disabled={clamped >= pageCount - 1} aria-label="Next page">›</button>
  </span>
</nav>

<style>
  nav { display: flex; align-items: center; justify-content: space-between; gap: var(--tint-space-3); border-top: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-3); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .controls { display: flex; align-items: center; gap: var(--tint-space-1); }
  .count { padding: 0 var(--tint-space-1); font-variant-numeric: tabular-nums; }
  button { display: inline-grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: 1.25rem; }
  button:hover:not(:disabled) { background: var(--tint-surface); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  button:disabled { cursor: not-allowed; opacity: 0.4; }
</style>
