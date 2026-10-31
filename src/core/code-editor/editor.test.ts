import { undo, undoDepth } from '@codemirror/commands'
import { describe, expect, it, vi } from 'vitest'
import { createCollabSession } from '../collab/createCollabSession'
import { createCodeEditorState, mountCodeEditor, revealCodeEditorLine, setCodeEditorValue } from './editor'

function createSession() {
  const session = createCollabSession({ room: 'code-editor-test', awareness: false, network: { kind: 'none' } })
  session.fragment.insert(0, 'print("hello")')
  return session
}

describe('CodeMirror editor model', () => {
  it('starts from the host document and applies read-only and accessible content options', () => {
    const session = createSession()
    const state = createCodeEditorState({ session, readOnly: true, label: 'Script' })
    expect(state.doc.toString()).toBe('print("hello")')
    expect(state.readOnly).toBe(true)
    session.destroy()
  })

  it('mounts and destroys an editor view without owning the collaborative session', () => {
    const session = createSession()
    const destroy = vi.spyOn(session, 'destroy')
    const host = document.createElement('div')
    document.body.append(host)
    const view = mountCodeEditor(host, { session, label: 'Lua source' })
    expect(view.contentDOM).toHaveAttribute('aria-label', 'Lua source')
    expect(view.state.doc.toString()).toBe('print("hello")')
    view.destroy()
    expect(destroy).not.toHaveBeenCalled()
    host.remove()
    session.destroy()
  })
})

describe('controlled source buffers', () => {
  it('reports local edits and undo but never turns a host replacement into a user edit', () => {
    const host = document.createElement('div'), onValueChange = vi.fn()
    const view = mountCodeEditor(host, { value: 'local count = 1', onValueChange })
    view.dispatch({ changes: { from: 14, insert: '0' } })
    expect(onValueChange).toHaveBeenLastCalledWith('local count = 01')
    expect(undoDepth(view.state)).toBe(1)
    expect(undo(view)).toBe(true)
    expect(onValueChange).toHaveBeenLastCalledWith('local count = 1')
    onValueChange.mockClear()
    setCodeEditorValue(view, '-- another file\nreturn false')
    expect(view.state.doc.toString()).toBe('-- another file\nreturn false')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(undoDepth(view.state)).toBe(0)
    view.destroy()
  })
  it('reveals a bounded debugger line without editing or changing read-only state', () => {
    const host = document.createElement('div'), onValueChange = vi.fn()
    document.body.append(host)
    const view = mountCodeEditor(host, { value: 'first\nsecond\nthird', onValueChange, readOnly: true })
    revealCodeEditorLine(view, 2)
    expect(view.state.selection.main.head).toBe(6)
    expect(view.hasFocus).toBe(true)
    revealCodeEditorLine(view, 100)
    expect(view.state.selection.main.head).toBe(13)
    revealCodeEditorLine(view, -2)
    expect(view.state.selection.main.head).toBe(0)
    revealCodeEditorLine(view, Number.NaN)
    expect(view.state.doc.toString()).toBe('first\nsecond\nthird')
    expect(view.state.readOnly).toBe(true)
    expect(onValueChange).not.toHaveBeenCalled()
    view.destroy(); host.remove()
  })
})
