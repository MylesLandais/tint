import { flattenExtensions, type Extensions } from '@tiptap/core'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { lowlight } from '../code/highlight'
import { CodeTabsExtension } from './codeTabs'

export function createEditorSchemaExtensions(
  includeDefaults: boolean,
  extensions: Extensions = [],
  placeholder = 'Start writing, or type / for commands…',
  codeTabsExtension: Extensions[number] = CodeTabsExtension,
): Extensions {
  const resolved: Extensions = [
    ...(includeDefaults ? [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      codeTabsExtension,
    ] : []),
    Placeholder.configure({ placeholder, includeChildren: true }),
    ...extensions,
  ]
  const names = new Set<string>()
  for (const extension of flattenExtensions(resolved)) {
    if (names.has(extension.name)) {
      throw new Error(`[tint] Duplicate Tiptap extension "${extension.name}". Disable Tint's default schema before replacing a built-in extension.`)
    }
    names.add(extension.name)
  }
  return resolved
}
