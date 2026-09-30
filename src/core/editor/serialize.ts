import { generateHTML, generateJSON } from '@tiptap/html'
import { createEditorSchemaExtensions } from './schema'
import type { EditorDocument, EditorSerializationOptions } from './types'

export function editorDocumentToHTML(document: EditorDocument, options: EditorSerializationOptions = {}): string {
  return generateHTML(document, createEditorSchemaExtensions(options.includeDefaultExtensions ?? true, options.extensions ?? []))
}

export function editorHTMLToDocument(html: string, options: EditorSerializationOptions = {}): EditorDocument {
  return generateJSON(html, createEditorSchemaExtensions(options.includeDefaultExtensions ?? true, options.extensions ?? [])) as EditorDocument
}

export function editorDocumentKey(document: EditorDocument): string { return JSON.stringify(document) }
