import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { tags } from '@lezer/highlight'
import { Annotation, EditorState, Transaction } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import type { Text as ExternalText } from 'yjs'
import type { CollabSession } from '../collab/types'
import type { EditorPresence } from '../collab/editorPresence'

type EditorOptions = {
  readOnly?: boolean
  label?: string
}
export type CodeEditorOptions = EditorOptions & (
  | { session: CollabSession; presence?: EditorPresence; value?: never; onValueChange?: never }
  | { value: string; onValueChange: (value: string) => void; session?: never; presence?: never }
)
export type CodeEditorView = EditorView
const externalValue = Annotation.define<boolean>()

const tintHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--tint-code-keyword)' },
  { tag: tags.string, color: 'var(--tint-code-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--tint-code-number)' },
  { tag: tags.comment, color: 'var(--tint-code-comment)' },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: 'var(--tint-code-function)' },
])

/** Build a host-owned collaborative or controlled CodeMirror buffer. */
export function createCodeEditorState({ session, presence, value, onValueChange, readOnly = false, label = 'Lua source editor' }: CodeEditorOptions): EditorState {
  return EditorState.create({
    doc: session ? session.fragment.toString() : value,
    extensions: [
      lineNumbers(), drawSelection(), highlightActiveLine(),
      keymap.of([...(session ? yUndoManagerKeymap : historyKeymap), ...defaultKeymap, indentWithTab]),
      StreamLanguage.define(lua), syntaxHighlighting(tintHighlightStyle),
      session ? yCollab(session.fragment as unknown as ExternalText, presence) : history(),
      EditorView.updateListener.of((update) => {
        if (!session && update.docChanged && update.transactions.some(transaction => transaction.docChanged && !transaction.annotation(externalValue))) {
          onValueChange?.(update.state.doc.toString())
        }
      }),
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

/** Apply a host replacement without reporting it as a user edit or local undo. */
export function setCodeEditorValue(view: EditorView, value: string): void {
  if (view.state.doc.toString() === value) return
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value },
    annotations: [externalValue.of(true), Transaction.addToHistory.of(false)] })
}

/** Reveal debugger/source-tree locations without changing the buffer. */
export function revealCodeEditorLine(view: EditorView | null, line: number): void {
  if (!view || !Number.isFinite(line)) return
  const anchor = view.state.doc.line(Math.max(1, Math.min(view.state.doc.lines, Math.trunc(line)))).from
  view.dispatch({ selection: { anchor }, effects: EditorView.scrollIntoView(anchor, { y: 'center' }) })
  view.focus()
}
