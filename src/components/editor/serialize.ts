import { generateHTML, generateJSON } from '@tiptap/html'
import type { EditorDocument, EditorSerializationOptions } from './types'
import { createEditorSchemaExtensions } from './extensions'

function serializationExtensions(options: EditorSerializationOptions) {
  return createEditorSchemaExtensions(
    options.includeDefaultExtensions ?? true,
    options.extensions ?? [],
  )
}

export function editorDocumentToHTML(
  document: EditorDocument,
  options: EditorSerializationOptions = {},
) {
  return generateHTML(document, serializationExtensions(options))
}

export function editorHTMLToDocument(
  html: string,
  options: EditorSerializationOptions = {},
): EditorDocument {
  return generateJSON(html, serializationExtensions(options)) as EditorDocument
}
