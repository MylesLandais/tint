<script lang="ts">
  import { untrack } from 'svelte'
  import { CODE_LANGUAGES } from '../../../core/code'
  import { addEditorCodeTab, moveEditorCodeTab, removeEditorCodeTab, updateEditorCodeTab, type EditorCodeTab } from '../../../core/editor'
  import CodeTabs from '../code/CodeTabs.svelte'
  import type { CodeTab } from '../code/types'

  let { tabs, onApply }: { tabs: readonly EditorCodeTab[]; onApply: (tabs: readonly EditorCodeTab[]) => void } = $props()
  let editing = $state(false)
  let draft = $state<EditorCodeTab[]>(untrack(() => tabs.map((tab) => ({ ...tab }))))
  let selected = $state(0)
  let current = $derived(draft[selected])
  let copied = $state<string | null>(null)

  async function copyInstall(tab: CodeTab) {
    if (!tab.installCommand) return
    try { await navigator.clipboard.writeText(tab.installCommand); copied = tab.id }
    catch { copied = null }
  }
  function update(patch: Partial<EditorCodeTab>) { draft = updateEditorCodeTab(draft, selected, patch) }
  function add() { draft = addEditorCodeTab(draft); selected = draft.length - 1 }
  function remove() { draft = removeEditorCodeTab(draft, selected); selected = Math.min(selected, draft.length - 1) }
  function move(direction: -1 | 1) {
    const next = selected + direction
    if (next < 0 || next >= draft.length) return
    draft = moveEditorCodeTab(draft, selected, direction)
    selected = next
  }
  function apply() { onApply(draft); editing = false }
</script>

{#snippet install(tab: CodeTab)}
  {#if tab.installCommand}
    <div class="install"><code>{tab.installCommand}</code><button type="button" aria-label={copied === tab.id ? 'Install command copied' : 'Copy install command'} onclick={() => void copyInstall(tab)}>{copied === tab.id ? 'Copied' : 'Copy'}</button></div>
  {/if}
{/snippet}

<div class="node-view" contenteditable="false" data-tint-code-tabs-node="">
  <CodeTabs {tabs} accessory={install} />
  <button type="button" class="builder-toggle" onclick={() => editing = !editing}>{editing ? 'Hide tab builder' : 'Edit tabbed code'}</button>
  {#if editing && current}
    <div class="builder">
      <div class="tab-buttons" role="group" aria-label="Tabbed code entries">
        {#each draft as tab, index (tab.id)}<button type="button" aria-pressed={index === selected} onclick={() => selected = index}>{tab.label ?? tab.language ?? tab.id}</button>{/each}
        <button type="button" aria-label="Add tab" onclick={add}>+</button>
      </div>
      <div class="fields">
        <label>Language<select class="tint-select" value={current.language ?? 'plaintext'} onchange={(event) => update({ language: event.currentTarget.value })}>{#each CODE_LANGUAGES as language (language.value)}<option value={language.value}>{language.label}</option>{/each}</select></label>
        <label>Label<input value={current.label ?? ''} oninput={(event) => update({ label: event.currentTarget.value })} /></label>
        <label>Install command<input value={current.installCommand ?? ''} oninput={(event) => update({ installCommand: event.currentTarget.value })} /></label>
        <label>Code<textarea rows="5" value={current.code} oninput={(event) => update({ code: event.currentTarget.value })}></textarea></label>
      </div>
      <div class="builder-actions">
        <button type="button" aria-label="Move tab left" disabled={selected === 0} onclick={() => move(-1)}>↑</button>
        <button type="button" aria-label="Move tab right" disabled={selected === draft.length - 1} onclick={() => move(1)}>↓</button>
        <button type="button" disabled={draft.length <= 1} onclick={remove}>Remove tab</button>
        <button type="button" onclick={() => editing = false}>Cancel</button>
        <button type="button" class="apply" onclick={apply}>Apply</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .node-view { min-width: 0; margin: var(--tint-space-3) 0; }
  button { min-height: 1.75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-xs); }
  button:hover, button[aria-pressed='true'] { background: var(--tint-accent-soft); }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  button:focus-visible, :is(input, select, textarea):focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .install { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tint-space-2); padding: var(--tint-space-2) var(--tint-space-3); }
  .install code { min-width: 0; overflow-wrap: anywhere; }
  .builder-toggle { margin-top: var(--tint-space-2); }
  .builder { display: flex; flex-direction: column; gap: var(--tint-space-3); margin-top: var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); padding: var(--tint-space-3); container-type: inline-size; }
  .tab-buttons, .builder-actions { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tint-space-2); }
  .fields label { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  :is(input, select, textarea) { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: var(--tint-space-1); color: var(--tint-ink); font: inherit; }
  .fields label:nth-child(3), .fields label:nth-child(4) { grid-column: span 2; }
  .builder-actions .apply { margin-left: auto; border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  @container (max-width: 360px) { .fields { grid-template-columns: 1fr; } .fields label:nth-child(3), .fields label:nth-child(4) { grid-column: auto; } }
</style>
