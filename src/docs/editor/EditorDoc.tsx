import { Extension, type Editor as TiptapEditor } from '@tiptap/core'
import { Clock3 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Editor,
  editorDocumentToHTML,
  type EditorDocument,
  type EditorSlashCommand,
} from '../../components/editor'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'
import { PropsTable } from '../components/PropsTable'

const INITIAL_DOCUMENT: EditorDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'A useful first draft' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a controlled rich-text buffer. Select text to format it, or type ' },
        { type: 'text', marks: [{ type: 'code' }], text: '/' },
        { type: 'text', text: ' on an empty line to insert a block.' },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'The app owns the document; Tint owns the editing experience.' }],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Things to try' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use the toolbar or keyboard shortcuts.' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Collapse and reopen the panel; undo history stays intact.' }] }],
        },
      ],
    },
  ],
}

const docsShortcut = Extension.create({
  name: 'docsInsertEmDash',
  addKeyboardShortcuts() {
    return {
      'Mod-Shift--': () => this.editor.commands.insertContent('—'),
    }
  },
})
const DOC_EXTENSIONS = [docsShortcut]

const usageCode = `import { Editor, type EditorDocument } from 'tint/editor'
import { useState } from 'react'

const emptyDocument: EditorDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function Draft() {
  const [value, setValue] = useState(emptyDocument)
  const [expanded, setExpanded] = useState(true)

  return (
    <Editor
      value={value}
      onValueChange={setValue}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  )
}`

const editorProps = [
  { name: 'value', type: 'EditorDocument', required: true, description: 'Controlled Tiptap JSON document.' },
  { name: 'onValueChange', type: '(value: EditorDocument) => void', required: true, description: 'Receives JSON after a document transaction.' },
  { name: 'expanded', type: 'boolean', required: true, description: 'Controlled Panel disclosure state.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', required: true, description: 'Reports disclosure intent.' },
  { name: 'extensions', type: 'Extensions', description: 'Raw Tiptap extensions appended after Tint defaults.' },
  { name: 'includeDefaultExtensions', type: 'boolean', defaultValue: 'true', description: 'Disable to provide a complete custom schema.' },
  { name: 'slashCommands', type: 'readonly EditorSlashCommand[]', description: 'Adds or replaces slash commands by id.' },
  { name: 'editable', type: 'boolean', defaultValue: 'true', description: 'Switches the document into read-only mode.' },
  { name: 'editorRef', type: 'Ref<TiptapEditor | null>', description: 'Access to the underlying Tiptap instance.' },
]

function countWords(document: EditorDocument) {
  const text: string[] = []
  const visit = (node: EditorDocument) => {
    if (node.text) text.push(node.text)
    node.content?.forEach(visit)
  }
  visit(document)
  return text.join(' ').trim().split(/\s+/).filter(Boolean).length
}

export function EditorDoc() {
  const [document, setDocument] = useState<EditorDocument>(INITIAL_DOCUMENT)
  const [expanded, setExpanded] = useState(true)
  const [showJson, setShowJson] = useState(false)
  const [contentError, setContentError] = useState<string>()
  const editorRef = useRef<TiptapEditor | null>(null)

  const slashCommands = useMemo<readonly EditorSlashCommand[]>(
    () => [
      {
        id: 'timestamp',
        label: 'Timestamp',
        description: 'Insert the current local date and time.',
        keywords: ['date', 'time', 'now'],
        icon: Clock3,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).insertContent(
            new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date()),
          ).run(),
      },
    ],
    [],
  )

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav current="components/editor" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">Magical text buffer</p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">Editor</h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            A controlled WYSIWYG drafting surface with block commands, selection formatting,
            keyboard shortcuts, and an escape hatch into the full Tiptap extension system.
          </p>
        </section>

        <section className="mb-14">
          <Editor
            value={document}
            onValueChange={(next) => {
              setContentError(undefined)
              setDocument(next)
            }}
            expanded={expanded}
            onExpandedChange={setExpanded}
            status={`${countWords(document)} words`}
            extensions={DOC_EXTENSIONS}
            slashCommands={slashCommands}
            editorRef={editorRef}
            onContentError={(error) => setContentError(error.message)}
            toolbarEnd={
              <button
                type="button"
                onClick={() => setShowJson((current) => !current)}
                className="rounded-md px-2 py-1 text-xs text-tint-muted hover:bg-tint-accent-soft hover:text-tint-ink"
              >
                {showJson ? 'Hide JSON' : 'Show JSON'}
              </button>
            }
          />
          {contentError ? <p role="alert" className="text-sm text-tint-danger">{contentError}</p> : null}
          {showJson ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <CodeBlock code={JSON.stringify(document, null, 2)} language="json" />
              <CodeBlock code={editorDocumentToHTML(document)} language="html" />
            </div>
          ) : null}
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">Required props are marked with an asterisk.</p>
          <PropsTable rows={editorProps} />
        </section>
      </div>
    </main>
  )
}
