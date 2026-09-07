import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import type { Text as ExternalText } from 'yjs'
import type { CollabSession, EditorPresence } from '../collab'

export type CodeEditorProps = {
  session: CollabSession
  presence?: EditorPresence
  readOnly?: boolean
  label?: string
  onView?: (view: EditorView | null) => void
}
/** A controlled collaborative code surface; the host owns its document lifetime. */
export function CodeEditor({ session, presence, readOnly = false, label = 'Lua source editor', onView }: CodeEditorProps) {
  const element = useRef<HTMLDivElement>(null)
  const viewCallback = useRef(onView)
  viewCallback.current = onView
  useEffect(() => {
    if (!element.current) return
    const view = new EditorView({
      parent: element.current,
      state: EditorState.create({ doc: session.fragment.toString(), extensions: [
        lineNumbers(), drawSelection(), highlightActiveLine(), keymap.of([...yUndoManagerKeymap, ...defaultKeymap, indentWithTab]),
        StreamLanguage.define(lua), syntaxHighlighting(defaultHighlightStyle),
        yCollab(session.fragment as unknown as ExternalText, presence), EditorState.readOnly.of(readOnly),
        EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false' }),
        EditorView.theme({ '&': { height: '100%', fontSize: '12px', color: '#d9e3e8', backgroundColor: '#12191f' }, '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace' }, '.cm-gutters': { backgroundColor: '#12191f', color: '#72828c', border: 'none' }, '.cm-content': { padding: '12px 0', caretColor: '#84d4bd' }, '&.cm-focused .cm-cursor': { borderLeftColor: '#84d4bd' } }, { dark: true }),
      ] }),
    })
    viewCallback.current?.(view)
    return () => { viewCallback.current?.(null); view.destroy() }
  }, [session, presence, readOnly, label])
  return <div ref={element} style={{ height: '100%', minHeight: 180, overflow: 'hidden' }} />
}
