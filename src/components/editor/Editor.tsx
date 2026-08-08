import type { Extensions } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { FileText } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode, type Ref } from 'react'
import { Icon } from '../icon'
import { Panel } from '../panel'
import { cn } from '../../lib/utils'
import { EditorBubbleMenu, EditorToolbar } from './EditorToolbar'
import { createEditorRuntimeExtensions } from './extensions'
import type { EditorDocument, EditorProps, EditorSlashCommand } from './types'

const EMPTY_EXTENSIONS: Extensions = []
const EMPTY_COMMANDS: readonly EditorSlashCommand[] = []

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

function documentKey(document: EditorDocument) {
  return JSON.stringify(document)
}

export function Editor({
  value,
  onValueChange,
  expanded,
  onExpandedChange,
  title = 'Editor',
  status,
  headerActions,
  toolbarEnd,
  placeholder = 'Start writing, or type / for commands…',
  label = 'Document editor',
  editable = true,
  autofocus = false,
  extensions,
  includeDefaultExtensions = true,
  slashCommands,
  editorRef,
  onContentError,
  className,
  bodyClassName,
}: EditorProps) {
  const onValueChangeRef = useRef(onValueChange)
  const onContentErrorRef = useRef(onContentError)
  onValueChangeRef.current = onValueChange
  onContentErrorRef.current = onContentError

  const runtimeExtensions = useMemo(
    () =>
      createEditorRuntimeExtensions(
        includeDefaultExtensions,
        extensions ?? EMPTY_EXTENSIONS,
        placeholder,
        slashCommands ?? EMPTY_COMMANDS,
      ),
    [extensions, includeDefaultExtensions, placeholder, slashCommands],
  )

  const editor = useEditor(
    {
      extensions: runtimeExtensions,
      content: value,
      editable,
      autofocus,
      enableContentCheck: true,
      onContentError: ({ error }) => onContentErrorRef.current?.(error),
      onUpdate: ({ editor: current }) => onValueChangeRef.current(current.getJSON()),
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': label,
          'aria-multiline': 'true',
          'data-tint-editor-input': '',
        },
      },
    },
    [runtimeExtensions],
  )

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable, false)
  }, [editable, editor])

  useEffect(() => {
    if (!editor) return
    const attributes = editor.options.editorProps.attributes ?? {}
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...attributes,
          role: 'textbox',
          'aria-label': label,
          'aria-multiline': 'true',
          'data-tint-editor-input': '',
        },
      },
    })
  }, [editor, label])

  const externalKey = documentKey(value)
  useEffect(() => {
    if (!editor || documentKey(editor.getJSON()) === externalKey) return
    try {
      editor.commands.setContent(value, {
        emitUpdate: false,
        errorOnInvalidContent: true,
      })
    } catch (error) {
      onContentErrorRef.current?.(
        error instanceof Error ? error : new Error('Invalid editor document'),
      )
    }
  }, [editor, externalKey, value])

  useEffect(() => {
    assignRef(editorRef, editor)
    return () => assignRef(editorRef, null)
  }, [editor, editorRef])

  let toolbarSlot: ReactNode
  if (typeof toolbarEnd === 'function') {
    toolbarSlot = editor ? toolbarEnd(editor) : null
  } else {
    toolbarSlot = toolbarEnd
  }

  return (
    <Panel
      title={title}
      icon={<Icon icon={FileText} size="sm" />}
      status={status}
      actions={headerActions}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      className={className}
      bodyClassName={cn('bg-tint-panel', bodyClassName)}
    >
      {editor ? (
        <>
          {editable ? <EditorToolbar editor={editor} end={toolbarSlot} /> : null}
          <EditorContent editor={editor} className="tint-editor-content" />
          {editable ? (
            <BubbleMenu editor={editor}>
              <EditorBubbleMenu editor={editor} />
            </BubbleMenu>
          ) : null}
        </>
      ) : (
        <div className="min-h-64 p-6 text-sm text-tint-muted">Loading editor…</div>
      )}
    </Panel>
  )
}
