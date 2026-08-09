import { mergeAttributes, Node, type JSONContent } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react'
import { Check, ChevronDown, ChevronUp, Copy, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CodeTabs, type CodeTab } from '../code'
import { CODE_LANGUAGES } from '../code/highlight'
import { Icon } from '../icon'

export type EditorCodeTab = CodeTab & { installCommand?: string }

const DEFAULT_CODE: Record<string, string> = {
  python: 'from google.adk import Agent\n\nagent = Agent(name="researcher")',
  typescript: "import { LlmAgent } from '@google/adk'\n\nconst agent = new LlmAgent({ name: 'researcher' })",
  go: 'a, _ := llmagent.New(llmagent.Config{\n    Name: "researcher",\n})',
  java: 'LlmAgent agent = LlmAgent.builder()\n    .name("researcher")\n    .build();',
  rust: 'let agent = Agent::new("researcher");',
  erlang: 'agent(Name) -> {researcher, Name}.',
}

export const DEFAULT_EDITOR_CODE_TABS: EditorCodeTab[] = [
  ['python', 'pip install google-adk'],
  ['typescript', 'npm install @google/adk'],
  ['go', 'go get google.golang.org/adk/v2'],
  ['java', 'com.google.adk:google-adk'],
  ['rust', 'cargo add google-adk'],
  ['erlang', 'rebar3 get-deps'],
].map(([language, installCommand]) => ({
  id: language,
  language,
  code: DEFAULT_CODE[language] ?? '',
  installCommand,
}))

function normalizeTabs(value: unknown): EditorCodeTab[] {
  if (!Array.isArray(value)) return DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab }))
  const tabs = value.filter((tab): tab is EditorCodeTab => {
    if (!tab || typeof tab !== 'object') return false
    const candidate = tab as Partial<EditorCodeTab>
    return typeof candidate.id === 'string' && typeof candidate.code === 'string'
  })
  return tabs.length ? tabs.map((tab) => ({ ...tab })) : DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab }))
}

function tabsFromElement(element: HTMLElement) {
  try {
    return normalizeTabs(JSON.parse(element.dataset.tabs ?? 'null'))
  } catch {
    return normalizeTabs(null)
  }
}

function InstallAccessory({ tab }: { tab: EditorCodeTab }) {
  const [copied, setCopied] = useState(false)
  if (!tab.installCommand) return null
  const copy = async () => {
    await navigator.clipboard.writeText(tab.installCommand ?? '')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
      <code className="rounded border border-tint-border bg-tint-panel px-2 py-1.5 font-mono">{tab.installCommand}</code>
      <button type="button" onClick={() => void copy()} aria-label={copied ? 'Install command copied' : 'Copy install command'} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-tint-muted hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent">
        <Icon icon={copied ? Check : Copy} size="sm" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function CodeTabsBuilder({ tabs, onApply, onCancel }: { tabs: EditorCodeTab[]; onApply: (tabs: EditorCodeTab[]) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => tabs.map((tab) => ({ ...tab })))
  const [selected, setSelected] = useState(0)
  const current = draft[selected]
  const languages = CODE_LANGUAGES.filter((language) => language.value !== 'plaintext')

  useEffect(() => {
    setDraft(tabs.map((tab) => ({ ...tab })))
    setSelected(0)
  }, [tabs])

  if (!current) return null
  const update = (changes: Partial<EditorCodeTab>) => setDraft((items) => items.map((item, index) => (index === selected ? { ...item, ...changes } : item)))
  const add = () => {
    const id = `tab-${draft.length + 1}`
    setDraft((items) => [...items, { id, language: 'plaintext', code: '', label: 'New tab' }])
    setSelected(draft.length)
  }
  const remove = () => {
    if (draft.length <= 1) return
    setDraft((items) => items.filter((_, index) => index !== selected))
    setSelected((index) => Math.max(0, Math.min(index, draft.length - 2)))
  }
  const move = (direction: -1 | 1) => {
    const next = selected + direction
    if (next < 0 || next >= draft.length) return
    setDraft((items) => {
      const copy = [...items]
      const item = copy[selected]
      if (!item) return items
      copy[selected] = copy[next]!
      copy[next] = item
      return copy
    })
    setSelected(next)
  }

  return (
    <div className="mt-3 rounded-lg border border-tint-border bg-tint-surface p-3" contentEditable={false}>
      <div className="flex flex-wrap items-center gap-1.5">
        {draft.map((tab, index) => (
          <button key={tab.id} type="button" onClick={() => setSelected(index)} className="rounded-md border border-tint-border px-2 py-1 text-xs aria-pressed:bg-tint-accent-soft" aria-pressed={index === selected}>{tab.label ?? tab.language ?? tab.id}</button>
        ))}
        <button type="button" onClick={add} aria-label="Add tab" className="rounded-md p-1.5 text-tint-muted hover:bg-tint-panel"><Icon icon={Plus} size="sm" /></button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-tint-muted">Language<select value={current.language ?? 'plaintext'} onChange={(event) => update({ language: event.target.value })} className="mt-1 h-8 w-full rounded border border-tint-border bg-tint-panel px-2 text-xs text-tint-ink"><option value="plaintext">Plain text</option>{languages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}</select></label>
        <label className="text-xs text-tint-muted">Label<input value={current.label ?? ''} onChange={(event) => update({ label: event.target.value })} className="mt-1 h-8 w-full rounded border border-tint-border bg-tint-panel px-2 text-xs text-tint-ink" /></label>
        <label className="text-xs text-tint-muted sm:col-span-2">Install command<input value={current.installCommand ?? ''} onChange={(event) => update({ installCommand: event.target.value })} className="mt-1 h-8 w-full rounded border border-tint-border bg-tint-panel px-2 font-mono text-xs text-tint-ink" /></label>
        <label className="text-xs text-tint-muted sm:col-span-2">Code<textarea value={current.code} onChange={(event) => update({ code: event.target.value })} rows={5} className="mt-1 w-full rounded border border-tint-border bg-tint-panel p-2 font-mono text-xs text-tint-ink" /></label>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <button type="button" onClick={() => move(-1)} aria-label="Move tab left" className="rounded p-1.5 text-tint-muted hover:bg-tint-panel"><Icon icon={ChevronUp} size="sm" /></button>
        <button type="button" onClick={() => move(1)} aria-label="Move tab right" className="rounded p-1.5 text-tint-muted hover:bg-tint-panel"><Icon icon={ChevronDown} size="sm" /></button>
        <button type="button" onClick={remove} disabled={draft.length <= 1} className="ml-auto rounded p-1.5 text-tint-danger-ink hover:bg-tint-danger/10 disabled:opacity-40"><Icon icon={X} size="sm" /></button>
        <button type="button" onClick={() => onCancel()} className="rounded border border-tint-border px-2.5 py-1.5 text-xs text-tint-muted">Cancel</button>
        <button type="button" onClick={() => onApply(draft)} className="rounded bg-tint-accent px-2.5 py-1.5 text-xs font-medium text-tint-on-accent">Apply</button>
      </div>
    </div>
  )
}

function CodeTabsNodeView({ node, updateAttributes }: ReactNodeViewProps) {
  const tabs = normalizeTabs(node.attrs.tabs)
  const [editing, setEditing] = useState(false)
  return (
    <NodeViewWrapper className="tint-code-tabs-node" contentEditable={false}>
      <CodeTabs tabs={tabs} renderAccessory={(tab) => <InstallAccessory tab={tab as EditorCodeTab} />} />
      <button type="button" onClick={() => setEditing((value) => !value)} className="mt-2 rounded-md border border-tint-border bg-tint-panel px-2.5 py-1.5 text-xs text-tint-muted hover:bg-tint-surface">{editing ? 'Hide tab builder' : 'Edit tabbed code'}</button>
      {editing ? <CodeTabsBuilder tabs={tabs} onApply={(next) => { updateAttributes({ tabs: next }); setEditing(false) }} onCancel={() => setEditing(false)} /> : null}
    </NodeViewWrapper>
  )
}

export const CodeTabsExtension = Node.create({
  name: 'codeTabs',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      tabs: {
        default: DEFAULT_EDITOR_CODE_TABS,
        renderHTML: () => ({}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-tint-code-tabs]', getAttrs: (element) => ({ tabs: tabsFromElement(element as HTMLElement) }) }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-tint-code-tabs': '', 'data-tabs': JSON.stringify(normalizeTabs(node.attrs.tabs)) })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeTabsNodeView)
  },
})

export function codeTabsContent(): JSONContent {
  return { type: 'codeTabs', attrs: { tabs: DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab })) } }
}
