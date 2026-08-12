import { Extension, type Editor as TiptapEditor } from '@tiptap/core'
import { Clock3 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Editor,
  type EditorDocument,
  type EditorSlashCommand,
} from '../../components/editor'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import { EditorOutput } from './EditorOutput'

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
  { name: 'title', type: 'ReactNode', defaultValue: "'Editor'", description: 'Panel disclosure label.' },
  { name: 'status', type: 'ReactNode', description: 'Save or sync state rendered beside the title.' },
  { name: 'headerActions', type: 'ReactNode', description: 'Controls in the panel header, outside the disclosure button.' },
  { name: 'toolbarEnd', type: 'ReactNode | ((editor: TiptapEditor) => ReactNode)', description: 'Trailing toolbar content. A function receives the live editor instance.' },
  { name: 'placeholder', type: 'string', defaultValue: "'Start writing, or type / for commands…'", description: 'Shown in the empty document.' },
  { name: 'label', type: 'string', defaultValue: "'Document editor'", description: 'Accessible name for the editable region.' },
  { name: 'editable', type: 'boolean', defaultValue: 'true', description: 'Switches the document into read-only mode; toolbar and bubble menu disappear.' },
  { name: 'autofocus', type: 'FocusPosition', defaultValue: 'false', description: 'Where to place the caret on mount.' },
  { name: 'extensions', type: 'Extensions', description: 'Raw Tiptap extensions appended after Tint defaults. Must be referentially stable.' },
  { name: 'includeDefaultExtensions', type: 'boolean', defaultValue: 'true', description: 'Disable to provide a complete custom schema.' },
  { name: 'slashCommands', type: 'readonly EditorSlashCommand[]', description: 'Adds or replaces slash commands by id. Must be referentially stable.' },
  { name: 'editorRef', type: 'Ref<TiptapEditor | null>', description: 'Access to the underlying Tiptap instance.' },
  { name: 'onContentError', type: '(error: Error) => void', description: 'Called when a document fails schema validation, instead of throwing.' },
  { name: 'className', type: 'string', description: 'Extra classes for the Panel root.' },
  { name: 'bodyClassName', type: 'string', description: 'Extra classes for the Panel body. Avoid display utilities — collapsing relies on the hidden attribute.' },
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
  const [showOutput, setShowOutput] = useState(false)
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
    <DocsPage
      route="components/editor"
      title="Editor"
      intro="A controlled WYSIWYG buffer with slash commands, selection formatting, and Tiptap extensions."
      note={
        <>
          The app owns the document JSON; Tint owns the drafting surface. Keep{' '}
          <code>extensions</code> and <code>slashCommands</code> referentially stable so
          the editor is not torn down on every render.
        </>
      }
    >
      <DocsSection id="preview" title="Preview">
        <DocsPreview>
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
                onClick={() => setShowOutput((current) => !current)}
                className="rounded-md px-2 py-1 text-xs text-tint-muted hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
              >
                {showOutput ? 'Hide output' : 'Show output'}
              </button>
            }
          />
          {contentError ? (
            <p role="alert" className="mt-3 mb-0 text-sm text-tint-danger">
              {contentError}
            </p>
          ) : null}
          {showOutput ? <EditorOutput document={document} /> : null}
        </DocsPreview>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="Controlled like the rest of the library: pass JSON in, receive JSON out, and own the Panel disclosure state yourself."
      >
        <CodeBlock code={usageCode} language="tsx" />
        <div className="mt-4 rounded-xl border border-tint-warning/40 bg-tint-warning-soft p-4 text-sm leading-6 text-tint-warning-ink">
          <strong className="font-semibold">
            Keep <code>extensions</code> and <code>slashCommands</code> stable.
          </strong>{' '}
          Both feed the dependency array that builds the Tiptap instance, so a fresh
          array literal on every render tears the editor down and rebuilds it — losing
          the caret, the selection, and the undo history as you type. Hoist them to
          module scope, or wrap them in <code>useMemo</code>. Omitting them entirely is
          safe.
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable rows={editorProps} />
      </DocsSection>
    </DocsPage>
  )
}
