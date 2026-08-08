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
  value: EditorDocument
  onValueChange: (value: EditorDocument) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  title?: ReactNode
  status?: ReactNode
  headerActions?: ReactNode
  toolbarEnd?: ReactNode | ((editor: TiptapEditor) => ReactNode)
  placeholder?: string
  label?: string
  editable?: boolean
  autofocus?: FocusPosition
  extensions?: Extensions
  includeDefaultExtensions?: boolean
  slashCommands?: readonly EditorSlashCommand[]
  editorRef?: Ref<TiptapEditor | null>
  onContentError?: (error: Error) => void
  className?: string
  bodyClassName?: string
}

export type EditorSerializationOptions = {
  extensions?: Extensions
  includeDefaultExtensions?: boolean
}
