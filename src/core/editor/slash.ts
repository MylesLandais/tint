import type { Editor, Range } from '@tiptap/core'
import { codeTabsContent } from './codeTabs'
import type { EditorSlashCommand } from './types'

function replaceRange(editor: Editor, range: Range) { return editor.chain().focus().deleteRange(range) }
function hasExtension(editor: Editor, name: string) { return editor.extensionManager.extensions.some((extension) => extension.name === name) }

export function defaultSlashCommands(): EditorSlashCommand[] {
  return [
    { id: 'paragraph', label: 'Text', description: 'Start writing with plain text.', keywords: ['paragraph', 'body'], isEnabled: (editor) => hasExtension(editor, 'paragraph'), command: ({ editor, range }) => replaceRange(editor, range).setParagraph().run() },
    { id: 'heading-1', label: 'Heading 1', description: 'Large section heading.', keywords: ['h1', 'title'], isEnabled: (editor) => hasExtension(editor, 'heading'), command: ({ editor, range }) => replaceRange(editor, range).setHeading({ level: 1 }).run() },
    { id: 'heading-2', label: 'Heading 2', description: 'Medium section heading.', keywords: ['h2', 'subtitle'], isEnabled: (editor) => hasExtension(editor, 'heading'), command: ({ editor, range }) => replaceRange(editor, range).setHeading({ level: 2 }).run() },
    { id: 'heading-3', label: 'Heading 3', description: 'Small section heading.', keywords: ['h3'], isEnabled: (editor) => hasExtension(editor, 'heading'), command: ({ editor, range }) => replaceRange(editor, range).setHeading({ level: 3 }).run() },
    { id: 'bullet-list', label: 'Bullet list', description: 'Create an unordered list.', keywords: ['ul', 'unordered'], isEnabled: (editor) => hasExtension(editor, 'bulletList'), command: ({ editor, range }) => replaceRange(editor, range).toggleBulletList().run() },
    { id: 'ordered-list', label: 'Numbered list', description: 'Create an ordered list.', keywords: ['ol', 'numbered'], isEnabled: (editor) => hasExtension(editor, 'orderedList'), command: ({ editor, range }) => replaceRange(editor, range).toggleOrderedList().run() },
    { id: 'blockquote', label: 'Quote', description: 'Call out a quotation.', keywords: ['blockquote'], isEnabled: (editor) => hasExtension(editor, 'blockquote'), command: ({ editor, range }) => replaceRange(editor, range).setBlockquote().run() },
    { id: 'code-block', label: 'Code block', description: 'Insert a preformatted code block.', keywords: ['pre', 'fence'], isEnabled: (editor) => hasExtension(editor, 'codeBlock'), command: ({ editor, range }) => replaceRange(editor, range).setCodeBlock().run() },
    { id: 'tabbed-code', label: 'Tabbed code', description: 'Insert a multi-language code container.', keywords: ['tabs', 'polyglot', 'examples'], isEnabled: (editor) => hasExtension(editor, 'codeTabs'), command: ({ editor, range }) => replaceRange(editor, range).insertContent(codeTabsContent()).run() },
    { id: 'horizontal-rule', label: 'Divider', description: 'Separate sections with a rule.', keywords: ['hr', 'separator'], isEnabled: (editor) => hasExtension(editor, 'horizontalRule'), command: ({ editor, range }) => replaceRange(editor, range).setHorizontalRule().run() },
  ]
}

export function mergeEditorSlashCommands(custom: readonly EditorSlashCommand[]): EditorSlashCommand[] {
  const commands = new Map(defaultSlashCommands().map((command) => [command.id, command]))
  for (const command of custom) commands.set(command.id, command)
  return [...commands.values()]
}

export function filterEditorSlashCommands(commands: readonly EditorSlashCommand[], query: string, editor: Editor): EditorSlashCommand[] {
  const needle = query.trim().toLocaleLowerCase()
  return commands.filter((command) => {
    if (command.isEnabled && !command.isEnabled(editor)) return false
    if (!needle) return true
    return [command.label, command.description, ...(command.keywords ?? [])]
      .filter(Boolean).some((candidate) => candidate?.toLocaleLowerCase().includes(needle))
  })
}
