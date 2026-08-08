import type { Editor as TiptapEditor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  Braces,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  TextQuote,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

type ToolbarButtonProps = {
  label: string
  icon: LucideIcon
  onPress: () => void
  pressed?: boolean
  disabled?: boolean
}

function ToolbarButton({
  label,
  icon,
  onPress,
  pressed,
  disabled,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault()
        onPress()
      }}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-tint-muted outline-none transition hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:ring-2 focus-visible:ring-tint-accent disabled:cursor-not-allowed disabled:opacity-40',
        pressed && 'bg-tint-accent-soft text-tint-accent',
      )}
    >
      <Icon icon={icon} size="sm" />
    </button>
  )
}

export function EditorToolbar({
  editor,
  end,
}: {
  editor: TiptapEditor
  end?: ReactNode
}) {
  const extensions = new Set(editor.extensionManager.extensions.map((extension) => extension.name))
  const hasHeading = extensions.has('heading')
  const hasParagraph = extensions.has('paragraph')
  const hasHistory = extensions.has('undoRedo')
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      block: current.isActive('heading', { level: 1 })
        ? 'heading-1'
        : current.isActive('heading', { level: 2 })
          ? 'heading-2'
          : current.isActive('heading', { level: 3 })
            ? 'heading-3'
            : 'paragraph',
      bullet: current.isActive('bulletList'),
      ordered: current.isActive('orderedList'),
      quote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
      canUndo: hasHistory && current.can().undo(),
      canRedo: hasHistory && current.can().redo(),
    }),
  })

  return (
    <div
      role="toolbar"
      aria-label="Document formatting"
      className="flex min-h-11 flex-wrap items-center gap-0.5 border-b border-tint-border bg-tint-surface px-2 py-1"
    >
      {hasHistory ? (
        <>
          <ToolbarButton
            label="Undo"
            icon={Undo2}
            disabled={!state.canUndo}
            onPress={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            label="Redo"
            icon={Redo2}
            disabled={!state.canRedo}
            onPress={() => editor.chain().focus().redo().run()}
          />
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-tint-border" />
        </>
      ) : null}
      {hasParagraph || hasHeading ? (
        <>
          <label className="sr-only" htmlFor={`tint-block-${editor.instanceId}`}>
            Block style
          </label>
          <select
            id={`tint-block-${editor.instanceId}`}
            aria-label="Block style"
            value={state.block}
            onChange={(event) => {
              const chain = editor.chain().focus()
              switch (event.target.value) {
                case 'heading-1':
                  chain.setHeading({ level: 1 }).run()
                  break
                case 'heading-2':
                  chain.setHeading({ level: 2 }).run()
                  break
                case 'heading-3':
                  chain.setHeading({ level: 3 }).run()
                  break
                default:
                  chain.setParagraph().run()
              }
            }}
            className="h-8 rounded-md border border-tint-border bg-tint-panel px-2 text-xs text-tint-ink outline-none focus-visible:ring-2 focus-visible:ring-tint-accent"
          >
            {hasParagraph ? <option value="paragraph">Text</option> : null}
            {hasHeading ? <option value="heading-1">Heading 1</option> : null}
            {hasHeading ? <option value="heading-2">Heading 2</option> : null}
            {hasHeading ? <option value="heading-3">Heading 3</option> : null}
          </select>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-tint-border" />
        </>
      ) : null}
      {extensions.has('bulletList') ? (
        <ToolbarButton
          label="Bullet list"
          icon={List}
          pressed={state.bullet}
          onPress={() => editor.chain().focus().toggleBulletList().run()}
        />
      ) : null}
      {extensions.has('orderedList') ? (
        <ToolbarButton
          label="Numbered list"
          icon={ListOrdered}
          pressed={state.ordered}
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
        />
      ) : null}
      {extensions.has('blockquote') ? (
        <ToolbarButton
          label="Block quote"
          icon={TextQuote}
          pressed={state.quote}
          onPress={() => editor.chain().focus().toggleBlockquote().run()}
        />
      ) : null}
      {extensions.has('codeBlock') ? (
        <ToolbarButton
          label="Code block"
          icon={Braces}
          pressed={state.codeBlock}
          onPress={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      ) : null}
      {end ? <div className="ml-auto flex items-center">{end}</div> : null}
    </div>
  )
}

export function EditorBubbleMenu({ editor }: { editor: TiptapEditor }) {
  const extensions = new Set(editor.extensionManager.extensions.map((extension) => extension.name))
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      code: current.isActive('code'),
      link: current.isActive('link'),
    }),
  })

  const setLink = () => {
    const previous = String(editor.getAttributes('link').href ?? '')
    const href = window.prompt('Link URL', previous)
    if (href === null) return
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  if (!['bold', 'italic', 'underline', 'strike', 'code', 'link'].some((name) => extensions.has(name))) {
    return null
  }

  return (
    <div
      role="toolbar"
      aria-label="Selection formatting"
      className="flex items-center gap-0.5 rounded-lg border border-tint-border bg-tint-panel p-1 shadow-xl"
    >
      {extensions.has('bold') ? (
        <ToolbarButton
          label="Bold"
          icon={Bold}
          pressed={state.bold}
          onPress={() => editor.chain().focus().toggleBold().run()}
        />
      ) : null}
      {extensions.has('italic') ? (
        <ToolbarButton
          label="Italic"
          icon={Italic}
          pressed={state.italic}
          onPress={() => editor.chain().focus().toggleItalic().run()}
        />
      ) : null}
      {extensions.has('underline') ? (
        <ToolbarButton
          label="Underline"
          icon={Underline}
          pressed={state.underline}
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        />
      ) : null}
      {extensions.has('strike') ? (
        <ToolbarButton
          label="Strikethrough"
          icon={Strikethrough}
          pressed={state.strike}
          onPress={() => editor.chain().focus().toggleStrike().run()}
        />
      ) : null}
      {extensions.has('code') ? (
        <ToolbarButton
          label="Inline code"
          icon={Code}
          pressed={state.code}
          onPress={() => editor.chain().focus().toggleCode().run()}
        />
      ) : null}
      {extensions.has('link') ? (
        <ToolbarButton label="Link" icon={Link2} pressed={state.link} onPress={setLink} />
      ) : null}
    </div>
  )
}
