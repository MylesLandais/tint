import type { Editor as TiptapEditor, Extensions, FocusPosition } from '@tiptap/core'
import type { LucideIcon } from '@lucide/svelte'
import type { Snippet } from 'svelte'
import type { EditorDocument, EditorSlashCommand as CoreEditorSlashCommand } from '../../../core/editor'

export type EditorSlashCommand = CoreEditorSlashCommand & { icon?: LucideIcon }

export type EditorProps = {
  value: EditorDocument
  onValueChange: (value: EditorDocument) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  title?: string | Snippet
  status?: Snippet
  headerActions?: Snippet
  toolbarEnd?: Snippet<[editor: TiptapEditor]>
  placeholder?: string
  label?: string
  editable?: boolean
  autofocus?: FocusPosition
  extensions?: Extensions
  includeDefaultExtensions?: boolean
  slashCommands?: readonly EditorSlashCommand[]
  editorRef?: (editor: TiptapEditor | null) => void
  onContentError?: (error: Error) => void
  class?: string
  bodyClass?: string
}
