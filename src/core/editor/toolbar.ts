import type { Editor } from '@tiptap/core'

export type EditorToolbarState = {
  block: 'paragraph' | 'heading-1' | 'heading-2' | 'heading-3'
  bullet: boolean
  ordered: boolean
  quote: boolean
  codeBlock: boolean
  codeLanguage: string
  canUndo: boolean
  canRedo: boolean
  extensionNames: readonly string[]
}

export type EditorSelectionState = {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  code: boolean
  link: boolean
  empty: boolean
  extensionNames: readonly string[]
}

export function editorToolbarState(editor: Editor | null | undefined): EditorToolbarState {
  if (!editor?.extensionManager) return {
    block: 'paragraph', bullet: false, ordered: false, quote: false, codeBlock: false,
    codeLanguage: 'plaintext', canUndo: false, canRedo: false, extensionNames: [],
  }
  const extensionNames = editor.extensionManager.extensions.map((extension) => extension.name)
  const hasHistory = extensionNames.includes('undoRedo')
  return {
    block: editor.isActive('heading', { level: 1 }) ? 'heading-1'
      : editor.isActive('heading', { level: 2 }) ? 'heading-2'
        : editor.isActive('heading', { level: 3 }) ? 'heading-3' : 'paragraph',
    bullet: editor.isActive('bulletList'),
    ordered: editor.isActive('orderedList'),
    quote: editor.isActive('blockquote'),
    codeBlock: editor.isActive('codeBlock'),
    codeLanguage: (editor.getAttributes('codeBlock').language as string | null) ?? 'plaintext',
    canUndo: hasHistory && editor.can().undo(),
    canRedo: hasHistory && editor.can().redo(),
    extensionNames,
  }
}

export function editorSelectionState(editor: Editor | null | undefined): EditorSelectionState {
  if (!editor?.extensionManager) return {
    bold: false, italic: false, underline: false, strike: false, code: false,
    link: false, empty: true, extensionNames: [],
  }
  return {
    bold: editor.isActive('bold'), italic: editor.isActive('italic'),
    underline: editor.isActive('underline'), strike: editor.isActive('strike'),
    code: editor.isActive('code'), link: editor.isActive('link'),
    empty: editor.state.selection.empty,
    extensionNames: editor.extensionManager.extensions.map((extension) => extension.name),
  }
}
