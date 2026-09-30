import type { Editor as TiptapEditor, Extensions, JSONContent, Range } from '@tiptap/core'

export type EditorDocument = JSONContent
export type EditorSerializationOptions = {
  extensions?: Extensions
  includeDefaultExtensions?: boolean
}
export type EditorCommandContext = { editor: TiptapEditor; range: Range }
export type EditorSlashCommand = {
  id: string
  label: string
  description?: string
  keywords?: readonly string[]
  command: (context: EditorCommandContext) => void
  isEnabled?: (editor: TiptapEditor) => boolean
}
