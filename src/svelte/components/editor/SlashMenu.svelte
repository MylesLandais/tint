<script lang="ts">
  import CommandMenu from '../shell/CommandMenu.svelte'
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

{#snippet commandIcon(item: { id: string; label: string })}
  {@const command = items.find((entry) => entry.id === item.id)}
  {@const glyph = command?.icon ?? EDITOR_SLASH_GLYPHS[item.id as keyof typeof EDITOR_SLASH_GLYPHS]}
  <span class="symbol">{#if glyph}<Icon icon={glyph} size="sm" />{:else}{item.label.slice(0, 1)}{/if}</span>
{/snippet}

{#if items.length === 0}
  <div id={menuId} role="status" class="empty">No matching blocks</div>
{:else}
  <div class="menu">
    <CommandMenu id={menuId} label="Insert block" query="" items={items} activeId={items[$selected]?.id}
      grouped={false} icon={commandIcon} preserveInputFocus
      onSelect={(id) => { const command = items.find((entry) => entry.id === id); if (command) onChoose(command) }}
      onActiveChange={(id) => selected.set(items.findIndex((entry) => entry.id === id))} />
  </div>
{/if}

<style>
  .menu, .empty { min-width: min(16rem, calc(100vw - 2rem)); }
  .empty { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); padding: var(--tint-space-2); color: var(--tint-ink); font-size: var(--tint-font-size-sm); }
  .symbol { display: inline-flex; width: 2rem; height: 2rem; flex: none; align-items: center; justify-content: center; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-muted); font-weight: 600; }
</style>
