import { mergeAttributes, Node, type JSONContent } from '@tiptap/core'

export type EditorCodeTab = {
  id: string
  code: string
  language?: string
  label?: string
  title?: string
  lineNumbers?: boolean
  startLine?: number
  highlightLines?: readonly number[]
  highlightWords?: readonly string[]
  installCommand?: string
}

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

export function normalizeEditorCodeTabs(value: unknown): EditorCodeTab[] {
  if (!Array.isArray(value)) return DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab }))
  const tabs = value.filter((tab): tab is EditorCodeTab => {
    if (!tab || typeof tab !== 'object') return false
    const candidate = tab as Partial<EditorCodeTab>
    return typeof candidate.id === 'string' && typeof candidate.code === 'string'
  })
  return tabs.length ? tabs.map((tab) => ({ ...tab })) : DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab }))
}

export function editorCodeTabsFromElement(element: HTMLElement): EditorCodeTab[] {
  try { return normalizeEditorCodeTabs(JSON.parse(element.dataset.tabs ?? 'null')) }
  catch { return normalizeEditorCodeTabs(null) }
}

export const CodeTabsExtension = Node.create({
  name: 'codeTabs',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return { tabs: { default: DEFAULT_EDITOR_CODE_TABS, renderHTML: () => ({}) } }
  },
  parseHTML() {
    return [{ tag: 'div[data-tint-code-tabs]', getAttrs: (element) => ({ tabs: editorCodeTabsFromElement(element as HTMLElement) }) }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-tint-code-tabs': '', 'data-tabs': JSON.stringify(normalizeEditorCodeTabs(node.attrs.tabs)) })]
  },
})

export function codeTabsContent(): JSONContent {
  return { type: 'codeTabs', attrs: { tabs: DEFAULT_EDITOR_CODE_TABS.map((tab) => ({ ...tab })) } }
}

export function updateEditorCodeTab(tabs: readonly EditorCodeTab[], index: number, patch: Partial<EditorCodeTab>): EditorCodeTab[] {
  return tabs.map((tab, at) => at === index ? { ...tab, ...patch, id: tab.id } : tab)
}

export function addEditorCodeTab(tabs: readonly EditorCodeTab[]): EditorCodeTab[] {
  const used = new Set(tabs.map((tab) => tab.id))
  let suffix = tabs.length + 1
  while (used.has(`tab-${suffix}`)) suffix++
  return [...tabs, { id: `tab-${suffix}`, language: 'plaintext', code: '', label: 'New tab' }]
}

export function removeEditorCodeTab(tabs: readonly EditorCodeTab[], index: number): EditorCodeTab[] {
  return tabs.length <= 1 ? [...tabs] : tabs.filter((_, at) => at !== index)
}

export function moveEditorCodeTab(tabs: readonly EditorCodeTab[], index: number, direction: -1 | 1): EditorCodeTab[] {
  const target = index + direction
  if (index < 0 || target < 0 || target >= tabs.length) return [...tabs]
  const next = [...tabs]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}
