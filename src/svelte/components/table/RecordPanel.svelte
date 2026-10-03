<script lang="ts" generics="TRow extends Record<string, unknown>">
  import { onMount } from 'svelte'
  import { cellIssue, draftFromValue, parseFieldValue, type DatasetOp, type FieldDef } from '../../../core/table'
  import DatasetCell from './DatasetCell.svelte'

  type Props = {
    fields: readonly FieldDef[]
    row: TRow
    idKey?: string
    /** Ids of fields hidden in the grid; they still appear here, marked as hidden. */
    hidden?: readonly string[]
    readOnly?: boolean
    onEdit?: (ops: DatasetOp<TRow>[], label: string) => void
    onDelete?: (rowId: string) => void
    onClose: () => void
    onStep?: (direction: -1 | 1) => void
  }
  let { fields, row, idKey = 'id', hidden = [], readOnly = false, onEdit, onDelete, onClose, onStep }: Props = $props()

  const rowId = $derived(String(row[idKey]))
  const title = $derived(String(row[fields[0]?.id] ?? '') || 'Untitled record')
  const uid = $props.id()
  let drafts = $state<Record<string, string>>({})
  let panel = $state<HTMLElement | null>(null)

  // A different record starts with fresh drafts.
  $effect(() => { void rowId; drafts = {} })
  onMount(() => { panel?.focus() })

  const current = (f: FieldDef) => drafts[f.id] ?? draftFromValue(f.type, row[f.id])
  const issueOf = (f: FieldDef) => (f.id in drafts ? cellIssue(f.type, drafts[f.id]) : null)

  function commit(f: FieldDef, draft: string) {
    delete drafts[f.id]
    drafts = { ...drafts }
    const parsed = parseFieldValue(f.type, draft)
    if (!parsed.ok || draft === draftFromValue(f.type, row[f.id])) return
    onEdit?.([{ kind: 'cell', rowId, field: f.id, before: row[f.id], after: parsed.value }], `Edit ${f.name}`)
  }
  function toggle(f: FieldDef) {
    onEdit?.([{ kind: 'cell', rowId, field: f.id, before: row[f.id], after: !row[f.id] }], `Toggle ${f.name}`)
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.stopPropagation(); onClose() }
    else if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); onStep?.(1) }
    else if (event.altKey && event.key === 'ArrowUp') { event.preventDefault(); onStep?.(-1) }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside class="panel" bind:this={panel} tabindex="-1" aria-label={`Record: ${title}`} onkeydown={keydown}>
  <header>
    <h3>{title}</h3>
    <div class="nav">
      {#if onStep}
        <button type="button" aria-label="Previous record" onclick={() => onStep(-1)}>↑</button>
        <button type="button" aria-label="Next record" onclick={() => onStep(1)}>↓</button>
      {/if}
      <button type="button" aria-label="Close record" onclick={onClose}>✕</button>
    </div>
  </header>

  <form class="fluid" onsubmit={(e) => e.preventDefault()}>
    {#each fields as f, i (f.id)}
      {@const issue = issueOf(f)}
      {@const locked = readOnly || f.readOnly}
      <div class="field" data-invalid={issue?.state === 'invalid' ? '' : undefined} data-warn={issue?.state === 'warn' ? '' : undefined} data-readonly={locked || undefined}>
        <label for={`${uid}-${f.id}`}>{f.name}{#if hidden.includes(f.id)}<em> · hidden in view</em>{/if}</label>
        {#if f.type === 'checkbox'}
          <button id={`${uid}-${f.id}`} type="button" class="toggle" role="checkbox" aria-checked={row[f.id] === true} disabled={locked} onclick={() => toggle(f)}>
            <DatasetCell field={f} value={row[f.id]} />
            <span>{row[f.id] === true ? 'Yes' : 'No'}</span>
          </button>
        {:else if f.type === 'select' || f.type === 'linked-record'}
          <select class="tint-select" id={`${uid}-${f.id}`} disabled={locked} value={current(f)} onchange={(e) => commit(f, e.currentTarget.value)}>
            <option value=""></option>
            {#each f.options ?? [] as o (o.value)}<option value={o.value}>{o.label ?? o.value}</option>{/each}
          </select>
        {:else if f.type === 'long-text'}
          <textarea id={`${uid}-${f.id}`} rows="4" disabled={locked} value={current(f)} oninput={(e) => (drafts[f.id] = e.currentTarget.value)} onblur={(e) => commit(f, e.currentTarget.value)}></textarea>
        {:else}
          <input
            id={`${uid}-${f.id}`} type="text" disabled={locked} value={current(f)} aria-invalid={issue?.state === 'invalid' || undefined}
            aria-describedby={issue ? `${uid}-${f.id}-msg` : undefined} autocomplete="off"
            placeholder={f.type === 'date' ? 'YYYY-MM-DD' : f.type === 'multi-select' ? 'a; b; c' : f.type === 'rating' ? '1 to 5' : ''}
            oninput={(e) => (drafts[f.id] = e.currentTarget.value)}
            onblur={(e) => commit(f, e.currentTarget.value)}
            onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(f, e.currentTarget.value) } }}
          />
        {/if}
        {#if issue}<p class="msg" id={`${uid}-${f.id}-msg`} role={issue.state === 'invalid' ? 'alert' : 'status'}>{issue.message}</p>{/if}
        {#if i === 0}<span class="primary" aria-hidden="true">Primary</span>{/if}
      </div>
    {/each}
  </form>

  {#if onDelete && !readOnly}
    <footer><button type="button" class="danger" onclick={() => onDelete(rowId)}>Delete record</button></footer>
  {/if}
</aside>

<style>
  .panel {
    display: flex; flex-direction: column; min-width: 0; max-height: 100%; overflow: auto; background: var(--tint-panel);
    border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); outline: none; font-size: var(--tint-font-size-sm); color: var(--tint-ink);
  }
  header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .75rem 1rem; border-bottom: 1px solid var(--tint-border); position: sticky; top: 0; background: var(--tint-panel); z-index: 2; }
  h3 { margin: 0; font-size: 1rem; overflow-wrap: anywhere; }
  .nav { display: flex; gap: .25rem; }
  .nav button, footer button {
    font: inherit; color: var(--tint-ink); background: var(--tint-panel); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .25rem .5rem; cursor: pointer;
  }
  .nav button:hover { background: var(--tint-accent-soft); }
  button:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: 1px; }

  /* Fluid stack: label lives inside the field's top band, fields butt together as one slab. */
  .fluid { display: grid; }
  .field {
    position: relative; display: grid; background: var(--tint-field); border-bottom: 1px solid var(--tint-border-strong); min-height: 3.5rem;
    transition: background-color 70ms cubic-bezier(.2, 0, .38, .9);
  }
  .field:focus-within { outline: 2px solid var(--tint-focus); outline-offset: -2px; z-index: 1; }
  .field[data-invalid] { outline: 2px solid var(--tint-danger); outline-offset: -2px; }
  .field[data-invalid]:not(:focus-within) { outline-style: dotted; }
  .field[data-warn] { outline: 2px dotted var(--tint-warning); outline-offset: -2px; }
  .field[data-readonly] { background: transparent; color: var(--tint-muted); }
  label { padding: .5rem 1rem 0; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  em { font-style: normal; opacity: .8; }
  input, select, textarea {
    font: inherit; color: var(--tint-ink); background: transparent; border: 0; outline: none; padding: .125rem 1rem .5rem; width: 100%; box-sizing: border-box; resize: vertical;
  }
  select { padding-inline-start: calc(1rem - 4px); }
  .toggle { display: flex; align-items: center; gap: .5rem; font: inherit; color: var(--tint-ink); background: none; border: 0; padding: .25rem 1rem .5rem; cursor: pointer; text-align: start; }
  .toggle:disabled { cursor: default; }
  .msg { margin: 0; padding: .375rem 1rem; font-size: var(--tint-font-size-xs); background: var(--tint-danger-soft); color: var(--tint-danger-ink); }
  [data-warn] .msg { background: var(--tint-warning-soft); color: var(--tint-warning-ink); }
  .primary { position: absolute; inset-block-start: .5rem; inset-inline-end: 1rem; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  footer { padding: .75rem 1rem; }
  .danger { color: var(--tint-danger-ink); border-color: var(--tint-danger); }
</style>
