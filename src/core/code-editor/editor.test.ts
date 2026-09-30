import { describe, expect, it, vi } from 'vitest'
import { createCollabSession } from '../collab/createCollabSession'
import { createCodeEditorState, mountCodeEditor } from './editor'

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
