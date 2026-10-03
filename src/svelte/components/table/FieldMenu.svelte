<script lang="ts">
  import { onMount } from 'svelte'
  import { listFieldTypes, type FieldDef, type TableFieldType } from '../../../core/table'
  import type { FieldAction } from './datasetTypes'

  type Props = {
    field: FieldDef
    isPrimary: boolean
    readOnly?: boolean
    onAction: (action: FieldAction) => void
    onClose: () => void
  }
  let { field, isPrimary, readOnly = false, onAction, onClose }: Props = $props()

  const TYPE_LABEL: Record<string, string> = {
    text: 'Single line text', 'long-text': 'Long text', number: 'Number', select: 'Single select',
    'multi-select': 'Multiple select', date: 'Date', checkbox: 'Checkbox', rating: 'Rating', url: 'URL',
    'linked-record': 'Linked record',
  }
  const types = listFieldTypes().filter((t) => t !== 'computed')

  let root = $state<HTMLDivElement | null>(null)
  // The menu is mounted per open, so the field's current values seed the form once.
  // svelte-ignore state_referenced_locally
  let name = $state(field.name)
  // svelte-ignore state_referenced_locally
  let type = $state<TableFieldType>(field.type)

  onMount(() => {
    root?.querySelector<HTMLElement>('input')?.focus()
    const away = (e: PointerEvent) => { if (root && !root.contains(e.target as Node)) onClose() }
    window.addEventListener('pointerdown', away, true)
    return () => window.removeEventListener('pointerdown', away, true)
  })

  function items() { return [...(root?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])] }
  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const list = items()
    const at = list.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'ArrowDown' ? (at + 1) % list.length : (at <= 0 ? list.length - 1 : at - 1)
    event.preventDefault()
    list[next]?.focus()
  }
  const run = (action: FieldAction) => { onAction(action); onClose() }
</script>

<div class="menu" bind:this={root} onkeydown={onKeydown} role="presentation">
  <form class="edit" onsubmit={(e) => { e.preventDefault(); if (name.trim() && name !== field.name) onAction({ kind: 'rename', name }); onClose() }}>
    <label>Field name<input bind:value={name} disabled={readOnly} autocomplete="off" /></label>
    <label>Field type
      <select class="tint-select" bind:value={type} disabled={readOnly} onchange={() => { onAction({ kind: 'retype', type }); onClose() }}>
        {#each types as t (t)}<option value={t}>{TYPE_LABEL[t] ?? t}</option>{/each}
      </select>
    </label>
  </form>
  <div role="menu" aria-label={`${field.name} field`}>
    <button role="menuitem" type="button" onclick={() => run({ kind: 'sort', desc: false })}>Sort A → Z</button>
    <button role="menuitem" type="button" onclick={() => run({ kind: 'sort', desc: true })}>Sort Z → A</button>
    <button role="menuitem" type="button" onclick={() => run({ kind: 'filter' })}>Filter by this field</button>
    <button role="menuitem" type="button" onclick={() => run({ kind: 'group' })}>Group by this field</button>
    {#if !readOnly}
      <hr />
      {#if !isPrimary}
        <button role="menuitem" type="button" onclick={() => run({ kind: 'primary' })}>Make primary field</button>
        <button role="menuitem" type="button" onclick={() => run({ kind: 'hide' })}>Hide field</button>
      {/if}
      <button role="menuitem" type="button" onclick={() => run({ kind: 'duplicate' })}>Duplicate field</button>
      {#if !isPrimary}<button role="menuitem" type="button" class="danger" onclick={() => run({ kind: 'delete' })}>Delete field</button>{/if}
    {/if}
  </div>
</div>

<style>
  .menu {
    position: absolute; z-index: 30; top: 100%; inset-inline-start: 0; min-width: 14rem; padding: .25rem;
    background: var(--tint-panel); border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-md);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--tint-shadow-color, #000) 22%, transparent); text-align: start; font-weight: 400;
  }
  .edit { display: grid; gap: .5rem; padding: .5rem; border-bottom: 1px solid var(--tint-border); }
  label { display: grid; gap: .125rem; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  input, select {
    font: inherit; color: var(--tint-ink); background: var(--tint-field); border: 0; border-bottom: 1px solid var(--tint-border-strong);
    padding: .375rem .5rem; border-radius: 0; outline-offset: -2px;
  }
  input:focus-visible, select:focus-visible { outline: 2px solid var(--tint-focus); }
  [role='menu'] { display: grid; padding-top: .25rem; }
  button {
    font: inherit; font-size: var(--tint-font-size-sm); text-align: start; color: var(--tint-ink); background: none; border: 0;
    padding: .375rem .5rem; border-radius: var(--tint-radius-sm); cursor: pointer;
  }
  button:hover, button:focus-visible { background: var(--tint-accent-soft); outline: none; }
  button:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: -2px; }
  .danger { color: var(--tint-danger-ink); }
  hr { border: 0; border-top: 1px solid var(--tint-border); margin: .25rem 0; width: 100%; }
</style>
