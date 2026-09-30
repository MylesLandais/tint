import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import type { Text as ExternalText } from 'yjs'
import type { CollabSession } from '../collab/types'
import type { EditorPresence } from '../collab/editorPresence'

export type CodeEditorOptions = {
  session: CollabSession
  presence?: EditorPresence
  readOnly?: boolean
  label?: string
}

/** Build the collaborative CodeMirror state without a component framework. */
export function createCodeEditorState({ session, presence, readOnly = false, label = 'Lua source editor' }: CodeEditorOptions): EditorState {
  return EditorState.create({
    doc: session.fragment.toString(),
    extensions: [
      lineNumbers(), drawSelection(), highlightActiveLine(),
      keymap.of([...yUndoManagerKeymap, ...defaultKeymap, indentWithTab]),
      StreamLanguage.define(lua), syntaxHighlighting(defaultHighlightStyle),
      yCollab(session.fragment as unknown as ExternalText, presence),
      EditorState.readOnly.of(readOnly),
      EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false' }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '12px', color: 'var(--tint-code-ink)', backgroundColor: 'var(--tint-code)' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace' },
        '.cm-gutters': { backgroundColor: 'var(--tint-code)', color: 'var(--tint-code-muted)', border: 'none' },
        '.cm-content': { padding: '12px 0', caretColor: 'var(--tint-accent)' },
        '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--tint-accent)' },
      }, { dark: true }),
    ],
  })
}

/** Mount a state in a host element; callers own `destroy()` on lifecycle changes. */
export function mountCodeEditor(parent: HTMLElement, options: CodeEditorOptions): EditorView {
  return new EditorView({ parent, state: createCodeEditorState(options) })
}
