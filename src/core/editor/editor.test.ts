import { Extension } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { addEditorCodeTab, codeTabsContent, DEFAULT_EDITOR_CODE_TABS, moveEditorCodeTab, normalizeEditorCodeTabs, removeEditorCodeTab, updateEditorCodeTab } from './codeTabs'
import { createEditorSchemaExtensions } from './schema'
import { editorDocumentToHTML, editorHTMLToDocument } from './serialize'
import { defaultSlashCommands } from './slash'
import type { EditorDocument } from './types'

describe('editor core', () => {
  it('round-trips the shared heading and tabbed code schemas through HTML', () => {
    const heading: EditorDocument = { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'External update' }] }] }
    expect(editorHTMLToDocument(editorDocumentToHTML(heading))).toEqual(heading)
    const tabbed: EditorDocument = { type: 'doc', content: [codeTabsContent()] }
    const html = editorDocumentToHTML(tabbed)
    expect(html).toContain('data-tint-code-tabs')
    expect(editorHTMLToDocument(html)).toEqual(tabbed)
    expect(DEFAULT_EDITOR_CODE_TABS).toHaveLength(6)
  })

  it('rejects duplicate schema extensions', () => {
    const duplicate = Extension.create({ name: 'paragraph' })
    expect(() => createEditorSchemaExtensions(true, [duplicate])).toThrow('Duplicate Tiptap extension "paragraph"')
  })

  it('keeps tab editing projections immutable and normalizes invalid attributes', () => {
    const first = [{ id: 'one', code: '1' }]
    const added = addEditorCodeTab(first)
    const edited = updateEditorCodeTab(added, 1, { code: '2', label: 'Two' })
    expect(edited[1]).toMatchObject({ id: 'tab-2', code: '2', label: 'Two' })
    expect(moveEditorCodeTab(edited, 1, -1).map(({ id }) => id)).toEqual(['tab-2', 'one'])
    expect(removeEditorCodeTab(edited, 1)).toEqual(first)
    expect(removeEditorCodeTab(first, 0)).toEqual(first)
    expect(normalizeEditorCodeTabs([{ id: 'valid', code: 'x' }, { id: 1, code: 'bad' }])).toEqual([{ id: 'valid', code: 'x' }])
    expect(first).toEqual([{ id: 'one', code: '1' }])
  })

  it('shares the full default slash command set', () => {
    expect(defaultSlashCommands().map(({ id }) => id)).toEqual([
      'paragraph', 'heading-1', 'heading-2', 'heading-3', 'bullet-list',
      'ordered-list', 'blockquote', 'code-block', 'tabbed-code', 'horizontal-rule',
    ])
  })
})
