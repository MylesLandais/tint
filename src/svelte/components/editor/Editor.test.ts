import { Extension, type Editor as TiptapEditor } from '@tiptap/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { defaultSlashCommands, editorDocumentToHTML, type EditorDocument } from '../../../core/editor'
import Editor from './Editor.svelte'

const FIRST: EditorDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First draft' }] }] }
const SECOND: EditorDocument = { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'External update' }] }] }
const noop = () => {}

describe('Svelte Tiptap Editor', () => {
  afterAll(async () => { await new Promise((resolve) => setTimeout(resolve, 300)) })

  it('renders controlled JSON and applies an external replacement without re-emitting', async () => {
    const onValueChange = vi.fn()
    const props = { value: FIRST, onValueChange, expanded: true, onExpandedChange: noop }
    const view = render(Editor, { props })
    expect(await screen.findByRole('textbox', { name: 'Document editor' })).toHaveTextContent('First draft')
    await view.rerender({ ...props, value: SECOND })
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('External update'))
    expect(onValueChange).not.toHaveBeenCalled()
    view.unmount()
  })

  it('reports transactions, supports raw extensions, and cleans up the editor ref', async () => {
    let instance: TiptapEditor | null = null
    const onValueChange = vi.fn()
    const editorRef = (value: TiptapEditor | null) => { instance = value }
    const extension = Extension.create({ name: 'testExtension' })
    const view = render(Editor, { props: { value: FIRST, onValueChange, expanded: true, onExpandedChange: noop, extensions: [extension], editorRef } })
    await screen.findByRole('textbox')
    const current = instance as TiptapEditor | null
    expect(current?.extensionManager.extensions.some((item) => item.name === 'testExtension')).toBe(true)
    current?.commands.insertContent(' plus more')
    await waitFor(() => expect(onValueChange).toHaveBeenCalled())
    expect(onValueChange.mock.lastCall?.[0]).toMatchObject({ type: 'doc' })
    view.unmount()
    expect(instance).toBeNull()
  })

  it('keeps the document mounted through controlled collapse and respects read-only mode', async () => {
    const onExpandedChange = vi.fn()
    const props = { value: FIRST, onValueChange: noop, expanded: true, onExpandedChange }
    const view = render(Editor, { props })
    const textbox = await screen.findByRole('textbox')
    await fireEvent.click(screen.getByRole('button', { name: 'Editor' }))
    expect(onExpandedChange).toHaveBeenCalledWith(false)
    expect(textbox.closest('[data-panel-body]')).not.toHaveAttribute('hidden')
    await view.rerender({ ...props, expanded: false })
    expect(textbox.closest('[data-panel-body]')).toHaveAttribute('hidden')
    await view.rerender({ ...props, expanded: true, editable: false, label: 'Preview document' })
    expect(screen.getByRole('textbox', { name: 'Preview document' })).toBe(textbox)
    expect(textbox).toHaveAttribute('contenteditable', 'false')
    expect(screen.queryByRole('toolbar', { name: 'Document formatting' })).not.toBeInTheDocument()
    view.unmount()
  })

  it('runs built-in slash commands and mounts a tabbed code node view', async () => {
    let instance: TiptapEditor | null = null
    const slash: EditorDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '/' }] }] }
    const view = render(Editor, { props: { value: slash, onValueChange: noop, expanded: true, onExpandedChange: noop, editorRef: (value: TiptapEditor | null) => { instance = value } } })
    await screen.findByRole('textbox')
    const current = instance as TiptapEditor | null
    defaultSlashCommands().find((command) => command.id === 'heading-1')?.command({ editor: current!, range: { from: 1, to: 2 } })
    expect(screen.getByRole('textbox').querySelector('h1')).toBeInTheDocument()
    current?.commands.insertContentAt(0, { type: 'codeTabs' })
    await waitFor(() => expect(screen.getByText('Edit tabbed code')).toBeInTheDocument())
    expect(editorDocumentToHTML(current!.getJSON())).toContain('data-tint-code-tabs')
    await fireEvent.click(screen.getByRole('button', { name: 'Edit tabbed code' }))
    expect(screen.getByRole('button', { name: 'Add tab' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Add tab' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(current!.getJSON().content?.[0]?.attrs?.tabs).toHaveLength(7))
    view.unmount()
  })

  it('offers selection formatting and applies a toolbar command to the live editor', async () => {
    let instance: TiptapEditor | null = null
    const view = render(Editor, { props: { value: FIRST, onValueChange: noop, expanded: true, onExpandedChange: noop, editorRef: (value: TiptapEditor | null) => { instance = value } } })
    await screen.findByRole('textbox')
    const current = instance as TiptapEditor | null
    current!.commands.setTextSelection({ from: 1, to: 6 })
    expect(await screen.findByRole('toolbar', { name: 'Selection formatting' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(current!.getJSON().content?.[0]?.content?.[0]?.marks).toEqual([{ type: 'bold' }])
    await fireEvent.click(screen.getByRole('button', { name: 'Tabbed code' }))
    expect(current!.getJSON().content?.some((node) => node.type === 'codeTabs')).toBe(true)
    view.unmount()
  })

  it('offers slash commands with keyboard selection in the Svelte menu', async () => {
    let instance: TiptapEditor | null = null
    const empty: EditorDocument = { type: 'doc', content: [{ type: 'paragraph' }] }
    const view = render(Editor, { props: { value: empty, onValueChange: noop, expanded: true, onExpandedChange: noop, editorRef: (value: TiptapEditor | null) => { instance = value } } })
    const textbox = await screen.findByRole('textbox')
    const current = instance as TiptapEditor | null
    current!.commands.insertContent('/')
    const menu = await screen.findByRole('listbox', { name: 'Insert block' })
    const options = within(menu).getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(textbox).toHaveAttribute('aria-controls', menu.id)
    expect(textbox).toHaveAttribute('aria-activedescendant', options[0]!.id)
    await fireEvent.keyDown(textbox, { key: 'ArrowDown' })
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(textbox).toHaveAttribute('aria-activedescendant', options[1]!.id)
    await fireEvent.keyDown(textbox, { key: 'Enter' })
    expect(textbox.querySelector('h1')).toBeInTheDocument()
    view.unmount()
  })

  it('keeps the toolbar present when a stable extension list is replaced', async () => {
    const first = [Extension.create({ name: 'toolbarRemountA' })]
    const second = [Extension.create({ name: 'toolbarRemountB' })]
    const props = { value: FIRST, onValueChange: noop, expanded: true, onExpandedChange: noop, extensions: first }
    const view = render(Editor, { props })
    expect(await screen.findByRole('toolbar', { name: 'Document formatting' })).toBeInTheDocument()
    await view.rerender({ ...props, extensions: second })
    expect(await screen.findByRole('toolbar', { name: 'Document formatting' })).toBeInTheDocument()
    expect(await screen.findByRole('textbox')).toHaveTextContent('First draft')
    view.unmount()
  })
})
