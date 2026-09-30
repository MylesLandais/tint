<script lang="ts">
  import type { Editor } from '@tiptap/core'
  import { editorSelectionState } from '../../../core/editor'
  import { EDITOR_GLYPHS } from '../icon/glyphs'
  import ToolbarAction from './ToolbarAction.svelte'

  let { editor, version }: { editor: Editor; version: number } = $props()
  let selectionState = $derived.by(() => { void version; return editorSelectionState(editor) })
  let names = $derived(new Set(selectionState.extensionNames))
  let available = $derived(['bold', 'italic', 'underline', 'strike', 'code', 'link'].some((name) => names.has(name)))
  let layoutVersion = $state(0)
  let position = $derived.by(() => {
    void version
    void layoutVersion
    if (selectionState.empty) return null
    try {
      const root = editor.view.dom.closest<HTMLElement>('[data-tint-editor]')
      if (!root) return null
      const from = editor.view.coordsAtPos(editor.state.selection.from)
      const to = editor.view.coordsAtPos(editor.state.selection.to)
      const bounds = root.getBoundingClientRect()
      return {
        left: Math.max(20, (from.left + to.right) / 2 - bounds.left),
        top: Math.max(4, Math.min(from.top, to.top) - bounds.top - 44),
      }
    } catch { return null }
  })

  $effect(() => {
    const reposition = () => { layoutVersion++ }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  })

  function setLink() {
    const previous = String(editor.getAttributes('link').href ?? '')
    const href = window.prompt('Link URL', previous)
    if (href === null) return
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }
</script>

{#if available && !selectionState.empty}
  <div role="toolbar" aria-label="Selection formatting" class="bubble" class:floating={Boolean(position)} style:left={position ? `${position.left}px` : undefined} style:top={position ? `${position.top}px` : undefined}>
    {#if names.has('bold')}<ToolbarAction label="Bold" icon={EDITOR_GLYPHS.bold} pressed={selectionState.bold} onPress={() => editor.chain().focus().toggleBold().run()} />{/if}
    {#if names.has('italic')}<ToolbarAction label="Italic" icon={EDITOR_GLYPHS.italic} pressed={selectionState.italic} onPress={() => editor.chain().focus().toggleItalic().run()} />{/if}
    {#if names.has('underline')}<ToolbarAction label="Underline" icon={EDITOR_GLYPHS.underline} pressed={selectionState.underline} onPress={() => editor.chain().focus().toggleUnderline().run()} />{/if}
    {#if names.has('strike')}<ToolbarAction label="Strikethrough" icon={EDITOR_GLYPHS.strike} pressed={selectionState.strike} onPress={() => editor.chain().focus().toggleStrike().run()} />{/if}
    {#if names.has('code')}<ToolbarAction label="Inline code" icon={EDITOR_GLYPHS.code} pressed={selectionState.code} onPress={() => editor.chain().focus().toggleCode().run()} />{/if}
    {#if names.has('link')}<ToolbarAction label="Link" icon={EDITOR_GLYPHS.link} pressed={selectionState.link} onPress={setLink} />{/if}
  </div>
{/if}

<style>
  .bubble { position: sticky; bottom: var(--tint-space-2); z-index: 2; display: inline-flex; align-items: center; gap: var(--tint-space-1); margin: var(--tint-space-2); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); padding: var(--tint-space-1); box-shadow: 0 6px 18px var(--tint-shadow-color); }
  .bubble.floating { position: absolute; bottom: auto; margin: 0; transform: translateX(-50%); }
</style>
