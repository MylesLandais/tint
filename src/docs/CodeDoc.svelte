<script lang="ts">
  import { CodeTabs, HighlightedCode, type CodeTab } from '../svelte/components/code'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const tabs: CodeTab[] = [
    { id: 'typescript', language: 'typescript', code: 'const greeting = "Hello, Tint"\nconsole.log(greeting)', lineNumbers: true, highlightLines: [2] },
    { id: 'python', language: 'python', code: 'greeting = "Hello, Tint"\nprint(greeting)', lineNumbers: true },
  ]
  let value = $state('typescript')
  const api: ApiRow[] = [
    { prop: 'HighlightedCode.code / language', type: 'string / string?', description: 'Escaped source and a registered language or alias. Unknown languages render as text.' },
    { prop: 'lineNumbers / startLine', type: 'boolean / number', description: 'Addressable lines with an optional first line number.' },
    { prop: 'highlightLines / highlightWords', type: 'readonly number[] / readonly string[]', description: 'Emphasize selected lines or literal words.' },
    { prop: 'CodeTabs.tabs', type: 'readonly CodeTab[]', description: 'Code examples with labels, titles, optional Tint icon, and highlighting settings.' },
    { prop: 'value / defaultValue / onValueChange', type: 'string / string / (id) => void', description: 'Controlled active tab, initial local tab, and selection intent.' },
    { prop: 'accessory', type: 'Snippet<[CodeTab]>', description: 'Optional host content synchronized with the active tab.' },
    { prop: 'CodeTabs label', type: 'string', description: 'Accessible name for the tablist.' },
    { prop: 'CodeTabs class', type: 'string', description: 'Additional class on the code tabs container.' },
  ]
  const usage = `import { CodeTabs, HighlightedCode } from '@nebula/tint/code'

let active = $state('typescript')
const tabs = [
  { id: 'typescript', language: 'typescript', code: 'const answer = 42' },
  { id: 'python', language: 'python', code: 'answer = 42' },
]

<CodeTabs {tabs} value={active} onValueChange={(id) => active = id} />
<pre><HighlightedCode code="const answer = 42" language="typescript" /></pre>`
</script>

{#snippet accessory(tab: CodeTab)}
  <p class="accessory">Active language: {tab.language}</p>
{/snippet}

<DocPage title="Code" description="Tint renders highlighted source as text nodes, preserving source text and multi-line grammar context. CodeTabs keeps tab selection and clipboard feedback accessible." importPath="@nebula/tint/code" {usage} {api} accessibility="Code tabs use the tablist, tab, and tabpanel pattern with arrow, Home, and End navigation. The selected tab has a single tab stop. Copy reports success only after the clipboard write resolves; syntax colors are decorative and source remains readable as text.">
  <div class="code-demo">
    <CodeTabs {tabs} {value} onValueChange={(next) => value = next} {accessory} />
    <div>
      <h3>Untrusted source remains text</h3>
      <pre><HighlightedCode code={'<div class="x">{a && b}</div>'} language="html" highlightWords={['div']} /></pre>
    </div>
  </div>
</DocPage>

<style>
  .code-demo { display: grid; gap: 1.25rem; }
  .accessory { margin: 0; padding: .7rem 1rem; color: var(--tint-muted); font-size: .8rem; }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  pre { overflow-x: auto; margin: 0; padding: 1rem; border: 1px solid var(--tint-code-border); border-radius: var(--tint-radius-sm); background: var(--tint-code); color: var(--tint-code-ink); }
</style>
