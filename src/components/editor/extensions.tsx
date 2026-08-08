import {
  Extension,
  flattenExtensions,
  type Editor,
  type Extensions,
  type Range,
} from '@tiptap/core'
import { Placeholder } from '@tiptap/extensions'
import { ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import {
  Braces,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  TextQuote,
} from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { Icon } from '../icon'
import type { EditorSlashCommand } from './types'

type SlashMenuProps = SuggestionProps<EditorSlashCommand, EditorSlashCommand>

type SlashMenuHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean
}

const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0)

  useEffect(() => setSelected(0), [items])

  const choose = (index: number) => {
    const item = items[index]
    if (item) command(item)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!items.length) {
      return event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter'
    }
    if (event.key === 'ArrowUp') {
      setSelected((current) => (current + items.length - 1) % items.length)
      return true
    }
    if (event.key === 'ArrowDown') {
      setSelected((current) => (current + 1) % items.length)
      return true
    }
    if (event.key === 'Enter') {
      choose(selected)
      return true
    }
    return false
  }

  useImperativeHandle(ref, () => ({ onKeyDown: handleKeyDown }))

  if (!items.length) {
    return (
      <div className="rounded-lg border border-tint-border bg-tint-panel px-3 py-2 text-sm text-tint-muted shadow-lg">
        No matching blocks
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Insert block"
      className="max-h-72 min-w-64 overflow-y-auto rounded-xl border border-tint-border bg-tint-panel p-1.5 shadow-xl"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={index === selected}
          onMouseDown={(event) => {
            event.preventDefault()
            choose(index)
          }}
          onMouseEnter={() => setSelected(index)}
          className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-tint-ink outline-none hover:bg-tint-accent-soft aria-selected:bg-tint-accent-soft"
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-tint-border bg-tint-surface text-tint-muted">
            {item.icon ? <Icon icon={item.icon} size="sm" /> : null}
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{item.label}</span>
            {item.description ? (
              <span className="mt-0.5 block text-xs text-tint-muted">
                {item.description}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  )
})

function replaceRange(editor: Editor, range: Range) {
  return editor.chain().focus().deleteRange(range)
}

function hasExtension(editor: Editor, name: string) {
  return editor.extensionManager.extensions.some((extension) => extension.name === name)
}

export function defaultSlashCommands(): EditorSlashCommand[] {
  return [
    {
      id: 'paragraph',
      label: 'Text',
      description: 'Start writing with plain text.',
      keywords: ['paragraph', 'body'],
      icon: Pilcrow,
      isEnabled: (editor) => hasExtension(editor, 'paragraph'),
      command: ({ editor, range }) => replaceRange(editor, range).setParagraph().run(),
    },
    {
      id: 'heading-1',
      label: 'Heading 1',
      description: 'Large section heading.',
      keywords: ['h1', 'title'],
      icon: Heading1,
      isEnabled: (editor) => hasExtension(editor, 'heading'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setHeading({ level: 1 }).run(),
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      description: 'Medium section heading.',
      keywords: ['h2', 'subtitle'],
      icon: Heading2,
      isEnabled: (editor) => hasExtension(editor, 'heading'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setHeading({ level: 2 }).run(),
    },
    {
      id: 'heading-3',
      label: 'Heading 3',
      description: 'Small section heading.',
      keywords: ['h3'],
      icon: Heading3,
      isEnabled: (editor) => hasExtension(editor, 'heading'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setHeading({ level: 3 }).run(),
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      description: 'Create an unordered list.',
      keywords: ['ul', 'unordered'],
      icon: List,
      isEnabled: (editor) => hasExtension(editor, 'bulletList'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).toggleBulletList().run(),
    },
    {
      id: 'ordered-list',
      label: 'Numbered list',
      description: 'Create an ordered list.',
      keywords: ['ol', 'numbered'],
      icon: ListOrdered,
      isEnabled: (editor) => hasExtension(editor, 'orderedList'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).toggleOrderedList().run(),
    },
    {
      id: 'blockquote',
      label: 'Quote',
      description: 'Call out a quotation.',
      keywords: ['blockquote'],
      icon: TextQuote,
      isEnabled: (editor) => hasExtension(editor, 'blockquote'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setBlockquote().run(),
    },
    {
      id: 'code-block',
      label: 'Code block',
      description: 'Insert a preformatted code block.',
      keywords: ['pre', 'fence'],
      icon: Braces,
      isEnabled: (editor) => hasExtension(editor, 'codeBlock'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setCodeBlock().run(),
    },
    {
      id: 'horizontal-rule',
      label: 'Divider',
      description: 'Separate sections with a rule.',
      keywords: ['hr', 'separator'],
      icon: Minus,
      isEnabled: (editor) => hasExtension(editor, 'horizontalRule'),
      command: ({ editor, range }) =>
        replaceRange(editor, range).setHorizontalRule().run(),
    },
  ]
}

function mergeCommands(custom: readonly EditorSlashCommand[]) {
  const commands = new Map(defaultSlashCommands().map((command) => [command.id, command]))
  for (const command of custom) commands.set(command.id, command)
  return [...commands.values()]
}

export function createSlashCommandExtension(custom: readonly EditorSlashCommand[]) {
  const commands = mergeCommands(custom)

  return Extension.create({
    name: 'tintSlashCommands',
    addProseMirrorPlugins() {
      const themedAncestor = this.editor.view.dom.closest<HTMLElement>(
        '[data-theme], [data-scheme]',
      )
      const container =
        themedAncestor && themedAncestor !== document.documentElement
          ? themedAncestor
          : document.body

      return [
        Suggestion<EditorSlashCommand, EditorSlashCommand>({
          editor: this.editor,
          char: '/',
          startOfLine: true,
          container,
          allow: ({ state, range }) => {
            const parent = state.doc.resolve(range.from).parent
            return parent.type.name !== 'codeBlock'
          },
          items: ({ query, editor }) => {
            const needle = query.trim().toLocaleLowerCase()
            return commands.filter((item) => {
              if (item.isEnabled && !item.isEnabled(editor)) return false
              if (!needle) return true
              return [item.label, item.description, ...(item.keywords ?? [])]
                .filter(Boolean)
                .some((candidate) =>
                  candidate?.toLocaleLowerCase().includes(needle),
                )
            })
          },
          command: ({ editor, range, props }) => props.command({ editor, range }),
          render: () => {
            let component: ReactRenderer<SlashMenuHandle, SlashMenuProps> | null = null
            let unmount: (() => void) | null = null

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  editor: props.editor,
                  props,
                })
                unmount = props.mount(component.element)
              },
              onUpdate: (props) => component?.updateProps(props),
              onKeyDown: ({ event }) => {
                if (event.key === 'Escape') return false
                return component?.ref?.onKeyDown(event) ?? false
              },
              onExit: () => {
                unmount?.()
                component?.destroy()
                unmount = null
                component = null
              },
            }
          },
        }),
      ]
    },
  })
}

export function createEditorSchemaExtensions(
  includeDefaults: boolean,
  extensions: Extensions = [],
  placeholder = 'Start writing, or type / for commands…',
) {
  const resolved = [
    ...(includeDefaults
      ? [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            link: {
              openOnClick: false,
              autolink: true,
              defaultProtocol: 'https',
            },
          }),
        ]
      : []),
    Placeholder.configure({ placeholder, includeChildren: true }),
    ...extensions,
  ]

  const names = new Set<string>()
  for (const extension of flattenExtensions(resolved)) {
    if (names.has(extension.name)) {
      throw new Error(
        `[tint] Duplicate Tiptap extension "${extension.name}". Disable Tint's default schema before replacing a built-in extension.`,
      )
    }
    names.add(extension.name)
  }

  return resolved
}

export function createEditorRuntimeExtensions(
  includeDefaults: boolean,
  extensions: Extensions,
  placeholder: string,
  slashCommands: readonly EditorSlashCommand[],
) {
  const resolved = [
    ...createEditorSchemaExtensions(includeDefaults, extensions, placeholder),
    createSlashCommandExtension(slashCommands),
  ]

  const names = flattenExtensions(resolved).map((extension) => extension.name)
  if (new Set(names).size !== names.length) {
    throw new Error('[tint] Editor extensions must have unique names.')
  }
  return resolved
}
