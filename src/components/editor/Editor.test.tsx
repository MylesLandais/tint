import { Extension, type Editor as TiptapEditor } from '@tiptap/core'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Editor } from './Editor'
import { defaultSlashCommands } from './extensions'
import { editorDocumentToHTML, editorHTMLToDocument } from './serialize'
import type { EditorDocument } from './types'

const FIRST_DOCUMENT: EditorDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First draft' }] }],
}

const SECOND_DOCUMENT: EditorDocument = {
  type: 'doc',
  content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'External update' }] }],
}

describe('Editor', () => {
  it('renders controlled JSON and synchronizes an external replacement without re-emitting', async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Editor
        value={FIRST_DOCUMENT}
        onValueChange={onValueChange}
        expanded
        onExpandedChange={() => {}}
      />,
    )

    expect(await screen.findByRole('textbox', { name: 'Document editor' })).toHaveTextContent(
      'First draft',
    )

    rerender(
      <Editor
        value={SECOND_DOCUMENT}
        onValueChange={onValueChange}
        expanded
        onExpandedChange={() => {}}
      />,
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('External update'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports editor transactions and supports raw extensions', async () => {
    let instance: TiptapEditor | null = null
    const onValueChange = vi.fn()
    const extension = Extension.create({ name: 'testExtension' })
    const extensions = [extension]

    render(
      <Editor
        value={FIRST_DOCUMENT}
        onValueChange={onValueChange}
        expanded
        onExpandedChange={() => {}}
        extensions={extensions}
        editorRef={(editor) => {
          instance = editor
        }}
      />,
    )

    await screen.findByRole('textbox')
    act(() => {
      instance?.commands.insertContent(' plus more')
    })

    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.lastCall?.[0]).toMatchObject({ type: 'doc' })
    const current = instance as TiptapEditor | null
    expect(current?.extensionManager.extensions.some((item) => item.name === 'testExtension')).toBe(
      true,
    )
  })

  it('keeps the document mounted through controlled panel collapse', async () => {
    function Example() {
      const [expanded, setExpanded] = useState(true)
      const [value, setValue] = useState(FIRST_DOCUMENT)
      return (
        <Editor
          value={value}
          onValueChange={setValue}
          expanded={expanded}
          onExpandedChange={setExpanded}
        />
      )
    }

    render(<Example />)
    const textbox = await screen.findByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }))
    expect(textbox).toBeInTheDocument()
    expect(textbox.closest('[data-panel-body]')).toHaveAttribute('hidden')
  })

  it('applies a built-in slash command to the requested range', async () => {
    let instance: TiptapEditor | null = null
    render(
      <Editor
        value={{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '/' }] }] }}
        onValueChange={() => {}}
        expanded
        onExpandedChange={() => {}}
        editorRef={(editor) => {
          instance = editor
        }}
      />,
    )
    await screen.findByRole('textbox')

    const heading = defaultSlashCommands().find((command) => command.id === 'heading-1')
    act(() => heading?.command({ editor: instance!, range: { from: 1, to: 2 } }))
    expect(screen.getByRole('textbox').querySelector('h1')).toBeInTheDocument()
  })

  it('round-trips the default document schema through HTML', () => {
    const html = editorDocumentToHTML(SECOND_DOCUMENT)
    expect(html).toContain('<h2>External update</h2>')
    expect(editorHTMLToDocument(html)).toEqual(SECOND_DOCUMENT)
  })

  it('rejects a duplicate raw extension unless defaults are disabled', () => {
    const duplicate = Extension.create({ name: 'paragraph' })
    expect(() => editorDocumentToHTML(FIRST_DOCUMENT, { extensions: [duplicate] })).toThrow(
      'Duplicate Tiptap extension "paragraph"',
    )
  })
})
