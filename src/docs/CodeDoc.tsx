import { CodeTabs, CODE_LANGUAGES, HighlightedCode } from '../components/code'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const tabsUsage = `import { CodeTabs } from 'tint/code'

<CodeTabs
  label="Install"
  tabs={[
    { id: 'npm', language: 'bash', code: 'npm i tint' },
    { id: 'pnpm', language: 'bash', code: 'pnpm add tint' },
  ]}
/>`

const highlightUsage = `import { HighlightedCode } from 'tint/code'

<pre>
  <HighlightedCode
    code={source}
    language="typescript"
    lineNumbers
    highlightLines={[2]}
    highlightWords={['useState']}
  />
</pre>`

const registerUsage = `import { lowlight } from 'tint/code'
import kotlin from 'highlight.js/lib/languages/kotlin'

// Tint registers a fixed subset; register more onto the shared instance.
lowlight.register({ kotlin })`

const previewDemoCode = `<CodeTabs
  label="Install tint"
  tabs={[
    { id: 'npm', label: 'npm', language: 'bash', code: 'npm i tint' },
    { id: 'pnpm', label: 'pnpm', language: 'bash', code: 'pnpm add tint' },
    { id: 'bun', label: 'bun', language: 'bash', code: 'bun add tint' },
  ]}
/>

<pre>
  <HighlightedCode
    code={source}
    language="typescript"
    lineNumbers
    highlightLines={[5]}
    highlightWords={['greet']}
  />
</pre>`

const highlightedProps = [
  { name: 'code', type: 'string', required: true, description: 'The source to render. Never set as raw HTML — the hast tree is walked into elements.' },
  { name: 'language', type: 'string', description: 'A language name or alias. Unregistered values fall back to plain text rather than throwing.' },
  { name: 'lineNumbers', type: 'boolean', defaultValue: 'false', description: 'Render one addressable row per line, each carrying `data-code-line`.' },
  { name: 'startLine', type: 'number', defaultValue: '1', description: 'First displayed line number.' },
  { name: 'highlightLines', type: 'readonly number[]', description: 'One-based source lines to tint as highlighted.' },
  { name: 'highlightWords', type: 'readonly string[]', description: 'Literal terms wrapped in `<mark>`, matched case-insensitively.' },
  { name: 'className', type: 'string', description: 'Extra classes for the `<code>` element.' },
]

const tabsProps = [
  { name: 'tabs', type: 'readonly CodeTab[]', required: true, description: 'Each tab carries its own code, language, and highlighting options. Give tabs a `label` when they share a language — the fallback is the language name, so three bash tabs would all read “Bash”.' },
  { name: 'value', type: 'string', description: 'Controlled active tab id. Omit to let the component track it.' },
  { name: 'defaultValue', type: 'string', description: 'Initial tab id in uncontrolled mode. Defaults to the first tab.' },
  { name: 'onValueChange', type: '(id: string) => void', description: 'Called with the newly-activated tab id.' },
  { name: 'label', type: 'string', defaultValue: "'Code examples'", description: 'Accessible name for the tablist.' },
  { name: 'renderAccessory', type: '(tab: CodeTab) => ReactNode', description: 'Content synchronized with the active tab, rendered below its panel.' },
]

const highlightedSignature = `export type HighlightedCodeProps = {
  code: string
  /** A language name or alias. Unknown values render as plain text. */
  language?: string
  className?: string
  /** Render one addressable line per row. */
  lineNumbers?: boolean
  /** First displayed line number when lineNumbers is enabled. */
  startLine?: number
  /** One-based source lines to tint as highlighted. */
  highlightLines?: readonly number[]
  /** Literal terms to emphasize in the rendered code. */
  highlightWords?: readonly string[]
}`

const tabsSignature = `export type CodeTabsProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  tabs: readonly CodeTab[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  label?: string
  /** Optional content synchronized with the active tab, rendered below its panel. */
  renderAccessory?: (tab: CodeTab) => ReactNode
}`

const SPANNING = `/**
 * A block comment that spans several lines.
 * Each line keeps its comment colour.
 */
export function greet(name: string) {
  return \`hello \${name}\`
}`

export function CodeDoc() {
  return (
    <DocsPage
      route="components/code"
      title="Code"
      intro="Syntax-highlighted code and tabbed examples. Both render through one lowlight instance shared with the editor’s code block and chat’s fenced blocks, so a language registered once is available everywhere."
      note="Nothing here is ever set as raw markup — lowlight’s hast output is walked into React elements, which matters because chat renders code that arrived over the wire."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="Tabs with a shared label, then line numbers, a highlighted line, and a marked word — with a comment spanning four lines, which stays a comment on every one of them."
      >
        <DocsDemo code={previewDemoCode}>
          <div className="flex flex-col gap-6">
            {/* `label` matters when tabs share a language: without it each one
                falls back to the language name and all three read "Bash". */}
            <CodeTabs
              label="Install tint"
              tabs={[
                { id: 'npm', label: 'npm', language: 'bash', code: 'npm i tint' },
                { id: 'pnpm', label: 'pnpm', language: 'bash', code: 'pnpm add tint' },
                { id: 'bun', label: 'bun', language: 'bash', code: 'bun add tint' },
              ]}
            />
            <pre className="m-0 overflow-x-auto rounded-lg bg-tint-code p-4 text-[13px] leading-6 text-tint-code-ink">
              <HighlightedCode
                code={SPANNING}
                language="typescript"
                lineNumbers
                highlightLines={[5]}
                highlightWords={['greet']}
              />
            </pre>
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={tabsUsage} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">
          Highlighting on its own
        </h3>
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
          <code>HighlightedCode</code> renders only the <code>&lt;code&gt;</code>{' '}
          contents, so it expects to sit inside your own <code>&lt;pre&gt;</code>.
        </p>
        <CodeBlock code={highlightUsage} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">
          Adding a language
        </h3>
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
          Tint registers {CODE_LANGUAGES.length - 1} grammars rather than all of
          highlight.js, which would dwarf the rest of the library. Colours come from{' '}
          <code>.hljs-*</code> rules mapped onto the <code>--tint-code-*</code> tokens, so
          anything you register follows the active palette for free.
        </p>
        <CodeBlock code={registerUsage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <div className="space-y-10">
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              HighlightedCode
            </h3>
            <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
              The full prop signature, from the source:
            </p>
            <div className="mb-6">
              <CodeBlock code={highlightedSignature} language="tsx" />
            </div>
            <PropsTable rows={highlightedProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">CodeTabs</h3>
            <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">
              The full prop signature, from the source:
            </p>
            <div className="mb-6">
              <CodeBlock code={tabsSignature} language="tsx" />
            </div>
            <PropsTable rows={tabsProps} />
          </div>
        </div>
      </DocsSection>

      <DocsFooter>
        <span>Syntax highlighting: highlight.js grammars via lowlight</span>
      </DocsFooter>
    </DocsPage>
  )
}
