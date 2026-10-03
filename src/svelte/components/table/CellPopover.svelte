<script lang="ts">
  import { onMount } from 'svelte'
  import type { FieldDef } from '../../../core/table'

  type Props = {
    field: FieldDef
    /** string for select / linked-record, string[] for multi-select. */
    value: unknown
    /** Typing over the cell opens the picker with that character already searched. */
    initialQuery?: string
    label: string
    onCommit: (value: string | string[] | null, created?: string) => void
    onClose: () => void
  }
  let { field, value, initialQuery = '', label, onCommit, onClose }: Props = $props()

  const multiple = $derived(field.type === 'multi-select')
  const canCreate = $derived(field.type !== 'linked-record')
  const uid = $props.id()

  // The popover is mounted per open, so the cell's current value seeds the staged choice once.
  // svelte-ignore state_referenced_locally
  let query = $state(initialQuery)
  // svelte-ignore state_referenced_locally
  let staged = $state<string[]>(Array.isArray(value) ? value.map(String) : value == null || value === '' ? [] : [String(value)])
  let activeIndex = $state(0)
  let created = $state<string | undefined>()
  let input = $state<HTMLInputElement | null>(null)
  let root = $state<HTMLDivElement | null>(null)
  let done = false
  let flipped = $state(false)

  type Row = { value: string; label: string; create?: boolean }
  const rows = $derived.by<Row[]>(() => {
    const q = query.trim().toLowerCase()
    const all: Row[] = (field.options ?? []).map((o) => ({ value: o.value, label: o.label ?? o.value }))
    const matches = q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all
    const exact = all.some((o) => o.label.toLowerCase() === q || o.value.toLowerCase() === q)
    return canCreate && q && !exact ? [...matches, { value: query.trim(), label: `Create “${query.trim()}”`, create: true }] : matches
  })
  const labelOf = (v: string) => field.options?.find((o) => o.value === v)?.label ?? v

  onMount(() => {
    input?.focus()
    // Open upward when there is no room below inside the grid's scroll area.
    const scroller = root?.closest('[data-grid-scroller]')
    if (root && scroller && root.getBoundingClientRect().bottom > scroller.getBoundingClientRect().bottom) flipped = true
    const away = (e: PointerEvent) => { if (root && !root.contains(e.target as Node)) close() }
    window.addEventListener('pointerdown', away, true)
    return () => window.removeEventListener('pointerdown', away, true)
  })
  $effect(() => { void rows.length; activeIndex = Math.min(activeIndex, Math.max(0, rows.length - 1)) })
  $effect(() => { activeIndex = 0; void query })

  function commit() {
    if (done) return
    done = true
    onCommit(multiple ? staged : (staged[0] ?? null), created)
  }
  function close() { commit(); onClose() }

  function choose(row: Row) {
    if (row.create) created = row.value
    if (multiple) {
      staged = staged.includes(row.value) ? staged.filter((v) => v !== row.value) : [...staged, row.value]
      query = ''
    } else {
      staged = staged[0] === row.value && !row.create ? [] : [row.value]
      close()
    }
  }

  function keydown(event: KeyboardEvent) {
    event.stopPropagation()
    if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = rows.length ? (activeIndex + 1) % rows.length : 0 }
    else if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = rows.length ? (activeIndex - 1 + rows.length) % rows.length : 0 }
    else if (event.key === 'Home') { event.preventDefault(); activeIndex = 0 }
    else if (event.key === 'End') { event.preventDefault(); activeIndex = Math.max(0, rows.length - 1) }
    else if (event.key === 'Enter') { event.preventDefault(); const row = rows[activeIndex]; if (row) choose(row); else if (multiple) close() }
    else if (event.key === 'Escape') { event.preventDefault(); close() }
    else if (event.key === 'Tab') { close() }
    else if (event.key === 'Backspace' && multiple && query === '' && staged.length) staged = staged.slice(0, -1)
  }

  $effect(() => {
    // Keep the highlighted option in view.
    root?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView?.({ block: 'nearest' })
  })
</script>

<div class="pop" class:flipped bind:this={root} role="presentation" onkeydown={keydown}>
  {#if multiple && staged.length}
    <div class="chosen">
      {#each staged as v (v)}
        <span class="chip">{labelOf(v)}<button type="button" tabindex="-1" aria-label={`Remove ${labelOf(v)}`} onclick={() => (staged = staged.filter((x) => x !== v))}>✕</button></span>
      {/each}
    </div>
  {/if}
  <input
    bind:this={input} bind:value={query} class="search" type="text" autocomplete="off" role="combobox"
    aria-label={label} aria-expanded="true" aria-controls={`${uid}-list`} aria-autocomplete="list"
    aria-activedescendant={rows.length ? `${uid}-opt-${activeIndex}` : undefined}
    placeholder={canCreate ? 'Find or create an option' : 'Find a record'}
  />
  <div class="list" id={`${uid}-list`} role="listbox" aria-multiselectable={multiple || undefined} aria-label={label}>
    {#each rows as row, i (row.create ? `create:${row.value}` : row.value)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        id={`${uid}-opt-${i}`} role="option" tabindex="-1" class="opt" class:create={row.create}
        data-index={i} data-active={i === activeIndex || undefined} aria-selected={staged.includes(row.value)}
        onpointerenter={() => (activeIndex = i)} onpointerdown={(e) => e.preventDefault()} onclick={() => choose(row)}
      >
        <span class="mark" aria-hidden="true">{staged.includes(row.value) ? '✓' : ''}</span>
        <span class="chip" class:plain={row.create}>{row.label}</span>
      </div>
    {:else}
      <p class="none">No matches</p>
    {/each}
  </div>
</div>

<style>
  .pop {
    position: absolute; z-index: 40; top: calc(100% + 2px); inset-inline-start: -1px; width: max(100% + 2px, 16rem); max-width: 22rem;
    display: grid; background: var(--tint-panel); color: var(--tint-ink); border: 1px solid var(--tint-muted);
    border-radius: var(--tint-radius-md); box-shadow: 0 8px 24px color-mix(in srgb, var(--tint-shadow-color, #000) 24%, transparent);
    font-size: var(--tint-font-size-sm); font-weight: 400; user-select: none; white-space: normal;
  }
  .pop.flipped { top: auto; bottom: calc(100% + 2px); }
  .search {
    font: inherit; color: var(--tint-ink); background: var(--tint-field); border: 0; border-bottom: 1px solid var(--tint-border-strong);
    padding: .5rem .75rem !important; outline: none; border-radius: var(--tint-radius-md) var(--tint-radius-md) 0 0; user-select: text;
  }
  .search:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: -2px; }
  .chosen { display: flex; flex-wrap: wrap; gap: .25rem; padding: .5rem .75rem 0; }
  .list { max-height: 14rem; overflow-y: auto; padding: .25rem; display: grid; gap: 1px; }
  .opt { display: flex; align-items: center; gap: .5rem; padding: .25rem .5rem; border-radius: var(--tint-radius-sm); cursor: pointer; }
  .opt[data-active] { background: var(--tint-selection); }
  .opt[aria-selected='true'] .chip { font-weight: 600; }
  .mark { width: 1rem; color: var(--tint-accent); flex: none; }
  .chip {
    display: inline-flex; align-items: center; gap: .25rem; padding: 0 .5rem; border-radius: 999px; background: var(--tint-accent-soft);
    color: var(--tint-ink); line-height: 1.5rem; font-size: var(--tint-font-size-xs); white-space: nowrap;
  }
  .chip.plain { background: transparent; padding: 0; font-size: var(--tint-font-size-sm); }
  .chip button { all: unset; cursor: pointer; font-size: .65rem; color: var(--tint-muted); padding: 0 .125rem; }
  .chip button:hover { color: var(--tint-ink); }
  .none { margin: 0; padding: .5rem .75rem; color: var(--tint-muted); }
</style>
