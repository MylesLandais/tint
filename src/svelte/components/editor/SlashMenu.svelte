<script lang="ts">
  import type { Writable } from 'svelte/store'
  import Icon from '../icon/Icon.svelte'
  import { EDITOR_SLASH_GLYPHS } from '../icon/glyphs'
  import type { EditorSlashCommand } from './types'

  let {
    items, selected, onChoose, menuId,
  }: {
    items: readonly EditorSlashCommand[]
    selected: Writable<number>
    onChoose: (command: EditorSlashCommand) => void
    menuId: string
  } = $props()
</script>

{#if items.length === 0}
  <div id={menuId} role="status" class="empty">No matching blocks</div>
{:else}
  <div id={menuId} role="listbox" aria-label="Insert block" class="menu">
    {#each items as item, index (item.id)}
      {@const glyph = item.icon ?? EDITOR_SLASH_GLYPHS[item.id as keyof typeof EDITOR_SLASH_GLYPHS]}
      <button
        id={`${menuId}-option-${index}`} type="button" role="option" aria-selected={index === $selected}
        onmousedown={(event) => event.preventDefault()}
        onclick={() => onChoose(item)}
        onmouseenter={() => selected.set(index)}
      >
        <span class="symbol" aria-hidden="true">
          {#if glyph}<Icon icon={glyph} size="sm" />{:else}{item.label.slice(0, 1)}{/if}
        </span>
        <span><strong>{item.label}</strong>{#if item.description}<small>{item.description}</small>{/if}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .menu, .empty { min-width: 16rem; max-height: 18rem; overflow-y: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); padding: var(--tint-space-2); color: var(--tint-ink); box-shadow: 0 8px 20px var(--tint-shadow-color); }
  .empty { font-size: var(--tint-font-size-sm); }
  button { display: flex; width: 100%; min-width: 0; align-items: flex-start; gap: var(--tint-space-3); border: 0; border-radius: var(--tint-radius-md); background: transparent; padding: var(--tint-space-2); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); text-align: left; }
  button:hover, button[aria-selected='true'] { background: var(--tint-accent-soft); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .symbol { display: inline-flex; width: 2rem; height: 2rem; flex: none; align-items: center; justify-content: center; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-muted); font-weight: 600; }
  strong { display: block; font-weight: 600; }
  small { display: block; margin-top: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
</style>
