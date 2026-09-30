import type { EditorView } from '@codemirror/view'
import type { CodeEditorOptions } from '../../../core/code-editor'

export type CodeEditorProps = CodeEditorOptions & {
  onView?: (view: EditorView | null) => void
}
