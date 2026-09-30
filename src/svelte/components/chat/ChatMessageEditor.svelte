<script lang="ts">
  import type { ChatMessageEditorProps } from './types'

  let { value, onValueChange, onSave, onCancel, busy = false, error,
    label = 'Edit message', maxLength, class: className }: ChatMessageEditorProps = $props()
  const id = $props.id()
  const button = 'rounded border border-tint-border px-3 py-1.5 text-sm hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent disabled:opacity-40'

  function save() { if (!busy && value.trim()) onSave() }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel() }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); save() }
  }
</script>

<form class={['flex min-w-0 flex-col gap-2 py-2', className]} aria-busy={busy}
  onsubmit={(event) => { event.preventDefault(); save() }}>
  <label for={id} class="text-xs font-medium">{label}</label>
  <textarea {id} {value} maxlength={maxLength} disabled={busy} rows="5"
    aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)}
    class="w-full min-w-0 resize-y rounded border border-tint-border bg-tint-panel p-2 text-sm text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
    oninput={(event) => onValueChange(event.currentTarget.value)} onkeydown={keydown}></textarea>
  {#if error}<p id={`${id}-error`} role="alert" class="text-sm text-tint-danger">{error}</p>{/if}
  <div class="flex flex-wrap gap-2">
    <button type="submit" class={button} disabled={busy || !value.trim()}>{busy ? 'Saving…' : 'Save message'}</button>
    <button type="button" class={button} disabled={busy} onclick={onCancel}>Cancel</button>
  </div>
</form>
