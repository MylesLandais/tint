import type {
  Editor as TiptapEditor,
  Extensions,
  JSONContent,
  Range,
} from '@tiptap/core'
import type { FocusPosition } from '@tiptap/core'
import type { Ref, ReactNode } from 'react'
import type { IconGlyph } from '../icon'

export type EditorDocument = JSONContent

export type EditorCommandContext = {
  editor: TiptapEditor
  range: Range
}

export type EditorSlashCommand = {
  id: string
  label: string
  description?: string
  keywords?: readonly string[]
  icon?: IconGlyph
  command: (context: EditorCommandContext) => void
  isEnabled?: (editor: TiptapEditor) => boolean
}

export type EditorProps = {
  /** The controlled Tiptap JSON document. */
  value: EditorDocument
  /** Called on every keystroke with the new document. */
  onValueChange: (value: EditorDocument) => void
  /** Controlled `Panel` disclosure state. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Panel disclosure label. */
  title?: ReactNode
  /** Save or sync state rendered beside the title. */
  status?: ReactNode
  /** Controls rendered in the panel header, outside the disclosure button. */
  headerActions?: ReactNode
  /** Trailing toolbar content. A function receives the live editor instance. */
  toolbarEnd?: ReactNode | ((editor: TiptapEditor) => ReactNode)
  /** Shown in the empty document. */
  placeholder?: string
  /** Accessible name for the editable region. */
  label?: string
  /** Set false for a read-only view; the toolbar and bubble menu disappear. */
  editable?: boolean
  /** Where to place the caret on mount. */
  autofocus?: FocusPosition
  /**
   * Extra Tiptap extensions.
   *
   * **Must be referentially stable.** This feeds the dependency array that
   * builds the editor, so a fresh array literal on every render destroys and
   * rebuilds the whole Tiptap instance each time — losing the caret, the undo
   * history, and the selection. Hoist it to module scope or wrap it in
   * `useMemo`. Leaving it `undefined` is safe.
   */
  extensions?: Extensions
  /** Set false to drop tint's defaults and supply the whole set yourself. */
  includeDefaultExtensions?: boolean
  /**
   * Commands offered by the `/` menu. Referentially stable, for the same
   * reason as `extensions` — see above.
   */
  slashCommands?: readonly EditorSlashCommand[]
  /** Receives the live Tiptap instance, for imperative commands. */
  editorRef?: Ref<TiptapEditor | null>
  /** Called when a document fails schema validation, instead of throwing. */
  onContentError?: (error: Error) => void
  /** Extra classes for the `Panel` root. */
  className?: string
  /**
   * Extra classes for the `Panel` body. Avoid `display` utilities — collapsing
   * relies on the `hidden` attribute, which they outrank.
   */
  bodyClassName?: string
}

export type EditorSerializationOptions = {
  extensions?: Extensions
  includeDefaultExtensions?: boolean
}
