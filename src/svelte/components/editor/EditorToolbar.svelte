<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import type { Snippet } from 'svelte'
  import { CODE_LANGUAGES } from '../../../core/code'
  import { codeTabsContent, editorToolbarState } from '../../../core/editor'
  import { EDITOR_GLYPHS } from '../icon/glyphs'
  import ToolbarAction from './ToolbarAction.svelte'

  let { editor, version, end }: { editor: Editor; version: number; end?: Snippet<[Editor]> } = $props()
  let state = $derived.by(() => { void version; return editorToolbarState(editor) })
  let names = $derived(new Set(state.extensionNames))

  function changeBlock(value: string) {
    const chain = editor.chain().focus()
    switch (value) {
      case 'heading-1': chain.setHeading({ level: 1 }).run(); break
      case 'heading-2': chain.setHeading({ level: 2 }).run(); break
      case 'heading-3': chain.setHeading({ level: 3 }).run(); break
      default: chain.setParagraph().run()
    }
  }
  function changeLanguage(value: string) {
    editor.chain().focus().updateAttributes('codeBlock', { language: value === 'plaintext' ? null : value }).run()
  }
</script>

<div role="toolbar" aria-label="Document formatting" class="toolbar">
  {#if names.has('undoRedo')}
    <ToolbarAction label="Undo" icon={EDITOR_GLYPHS.undo} disabled={!state.canUndo} onPress={() => editor.chain().focus().undo().run()} />
    <ToolbarAction label="Redo" icon={EDITOR_GLYPHS.redo} disabled={!state.canRedo} onPress={() => editor.chain().focus().redo().run()} />
    <span class="divider" aria-hidden="true"></span>
  {/if}
  {#if names.has('paragraph') || names.has('heading')}
    <select aria-label="Block style" value={state.block} onchange={(event) => changeBlock(event.currentTarget.value)}>
      {#if names.has('paragraph')}<option value="paragraph">Text</option>{/if}
      {#if names.has('heading')}<option value="heading-1">Heading 1</option><option value="heading-2">Heading 2</option><option value="heading-3">Heading 3</option>{/if}
    </select>
    <span class="divider" aria-hidden="true"></span>
  {/if}
  {#if names.has('bulletList')}<ToolbarAction label="Bullet list" icon={EDITOR_GLYPHS.bullet} pressed={state.bullet} onPress={() => editor.chain().focus().toggleBulletList().run()} />{/if}
  {#if names.has('orderedList')}<ToolbarAction label="Numbered list" icon={EDITOR_GLYPHS.ordered} pressed={state.ordered} onPress={() => editor.chain().focus().toggleOrderedList().run()} />{/if}
  {#if names.has('blockquote')}<ToolbarAction label="Block quote" icon={EDITOR_GLYPHS.quote} pressed={state.quote} onPress={() => editor.chain().focus().toggleBlockquote().run()} />{/if}
  {#if names.has('codeBlock')}<ToolbarAction label="Code block" icon={EDITOR_GLYPHS.codeBlock} pressed={state.codeBlock} onPress={() => editor.chain().focus().toggleCodeBlock().run()} />{/if}
  {#if names.has('codeTabs')}<ToolbarAction label="Tabbed code" icon={EDITOR_GLYPHS.codeTabs} onPress={() => editor.chain().focus().insertContent(codeTabsContent()).run()} />{/if}
  {#if names.has('codeBlock') && state.codeBlock}
    <span class="divider" aria-hidden="true"></span>
    <select aria-label="Code language" value={state.codeLanguage} onchange={(event) => changeLanguage(event.currentTarget.value)}>{#each CODE_LANGUAGES as language (language.value)}<option value={language.value}>{language.label}</option>{/each}</select>
  {/if}
  {#if end}<div class="end">{@render end(editor)}</div>{/if}
</div>

<style>
  .toolbar { display: flex; min-height: 2.75rem; flex-wrap: wrap; align-items: center; gap: 0.125rem; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); padding: var(--tint-space-1) var(--tint-space-2); }
  .divider { width: 1px; height: 1.25rem; margin: 0 var(--tint-space-1); background: var(--tint-border); }
  select { height: 2rem; max-width: 10rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-xs); }
  select:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .end { display: flex; align-items: center; margin-left: auto; }
</style>
