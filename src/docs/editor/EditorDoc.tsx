import { Extension, type Editor as TiptapEditor } from '@tiptap/core'
import { Check, Clock3, Copy } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Editor,
  type EditorDocument,
  type EditorSlashCommand,
} from '../../components/editor'
import { CodeTabs, type CodeTab } from '../../components/code'
import { Icon } from '../../components/icon'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'
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

const polyglotTabs = [
  { id: 'python', language: 'python', code: 'def greet(name):\n    return f"Hello, {name}!"' },
  { id: 'typescript', language: 'typescript', code: 'export const greet = (name: string) => `Hello, ${name}!`' },
  { id: 'go', language: 'go', code: 'func greet(name string) string {\n    return "Hello, " + name + "!"\n}' },
  { id: 'java', language: 'java', code: 'String greet(String name) {\n  return "Hello, " + name + "!";\n}' },
  { id: 'rust', language: 'rust', code: 'fn greet(name: &str) -> String {\n    format!("Hello, {name}!")\n}' },
  { id: 'erlang', language: 'erlang', code: 'greet(Name) -> io_lib:format("Hello, ~s!", [Name]).' },
] as const

type CodeTemplate = { id: string; title: string; tabs: readonly CodeTab[] }

const initialTemplates: CodeTemplate[] = [
  { id: 'agent-setup', title: 'Agent setup', tabs: polyglotTabs },
  {
    id: 'tooling',
    title: 'Tooling bootstrap',
    tabs: polyglotTabs.map((tab) => ({ ...tab, code: `${tab.code}\n\n// tooling bootstrap` })),
  },
  {
    id: 'deployment',
    title: 'Deployment entrypoint',
    tabs: polyglotTabs.map((tab) => ({ ...tab, code: `${tab.code}\n\n// deployment entrypoint` })),
  },
]

const installCommands: Record<string, string> = {
  python: 'pip install google-adk',
  typescript: 'npm install @google/adk',
  go: 'go get google.golang.org/adk/v2',
  java: 'com.google.adk:google-adk',
}

function InstallInfo({ tabId }: { tabId: string }) {
  const command = installCommands[tabId]
  const [copied, setCopied] = useState(false)

  if (!command) return null

  const copy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
      <div className="min-w-0 overflow-x-auto rounded-md border border-tint-border bg-tint-panel px-2.5 py-1.5 font-mono text-tint-ink">
        <code>{command}</code>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? 'Install command copied' : 'Copy install command'}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
      >
        <Icon icon={copied ? Check : Copy} size="sm" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function CodeTemplateBuilder() {
  const [templates, setTemplates] = useState<CodeTemplate[]>(initialTemplates)
  const addTemplate = () => {
    const index = templates.length + 1
    setTemplates((current) => [
      ...current,
      { id: `template-${index}`, title: `New container ${index}`, tabs: polyglotTabs },
    ])
  }
  const removeTemplate = (id: string) =>
    setTemplates((current) => (current.length <= 1 ? current : current.filter((template) => template.id !== id)))
  const moveTemplate = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= templates.length) return
    setTemplates((current) => {
      const copy = [...current]
      const item = copy[index]
      if (!item) return current
      copy[index] = copy[next]!
      copy[next] = item
      return copy
    })
  }

  return (
    <div className="space-y-5">
      {templates.map((template, index) => (
        <article key={template.id} className="rounded-2xl border border-tint-border bg-tint-panel p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-sm font-semibold text-tint-ink">{template.title}</h3>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => moveTemplate(index, -1)} disabled={index === 0} className="rounded px-2 py-1 text-xs text-tint-muted hover:bg-tint-surface disabled:opacity-40">Move up</button>
              <button type="button" onClick={() => moveTemplate(index, 1)} disabled={index === templates.length - 1} className="rounded px-2 py-1 text-xs text-tint-muted hover:bg-tint-surface disabled:opacity-40">Move down</button>
              <button type="button" onClick={() => removeTemplate(template.id)} disabled={templates.length <= 1} className="rounded px-2 py-1 text-xs text-tint-danger-ink hover:bg-tint-danger/10 disabled:opacity-40">Remove</button>
            </div>
          </div>
          <CodeTabs tabs={template.tabs} renderAccessory={(tab) => <InstallInfo tabId={tab.id} />} />
        </article>
      ))}
      <button type="button" onClick={addTemplate} className="rounded-lg border border-dashed border-tint-border px-3 py-2 text-sm font-medium text-tint-muted hover:border-tint-accent hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent">Add tabbed code container</button>
    </div>
  )
}

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
                onClick={() => setShowOutput((current) => !current)}
                className="rounded-md px-2 py-1 text-xs text-tint-muted hover:bg-tint-accent-soft hover:text-tint-ink"
              >
                {showOutput ? 'Hide output' : 'Show output'}
              </button>
            }
          />
          {contentError ? <p role="alert" className="text-sm text-tint-danger">{contentError}</p> : null}
          {showOutput ? <EditorOutput document={document} /> : null}
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section className="mb-14 max-w-3xl">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Polyglot code</h2>
          <p className="mb-5 text-tint-muted">Each container owns its active language, so templates can be reordered or expanded without coupling every example on the page.</p>
          <CodeTemplateBuilder />
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
