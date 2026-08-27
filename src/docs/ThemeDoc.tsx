import { ThemePicker, ThemeToggle, useColorScheme, useThemeName } from '../components/theme'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsPreview,
  DocsSection,
} from './components/DocsPage'

const THEMES = [
  { value: 'tint', label: 'Tint' },
  { value: 'solarized', label: 'Solarized' },
  { value: 'gruvbox', label: 'Gruvbox' },
  { value: 'latte', label: 'Catppuccin Latte' },
  { value: 'frappe', label: 'Catppuccin Frappé' },
  { value: 'macchiato', label: 'Catppuccin Macchiato' },
  { value: 'mocha', label: 'Catppuccin Mocha' },
] as const

const previewDemoCode = `<ThemeToggle value={preference} onChange={setPreference} />
<ThemeToggle value={preference} onChange={setPreference} showLabels />

<ThemePicker value={theme} onChange={setTheme} themes={THEMES} />`

const usageCode = `import { ThemePicker, ThemeToggle, useColorScheme, useThemeName } from 'tint/theme'

const THEMES = [
  { value: 'tint', label: 'Tint' },
  { value: 'solarized', label: 'Solarized' },
]

export function Appearance() {
  const { preference, setPreference } = useColorScheme()
  const { theme, setTheme } = useThemeName()

  return (
    <>
      <ThemePicker value={theme} onChange={setTheme} themes={THEMES} />
      <ThemeToggle value={preference} onChange={setPreference} />
    </>
  )
}`

const themeToggleSignature = `export type ThemeToggleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> & {
  value: ColorSchemePreference
  onChange: (preference: ColorSchemePreference) => void
  /** Accessible name for the group. */
  label?: string
  /** Render labels beside the icons instead of icon-only. */
  showLabels?: boolean
}`

const themePickerSignature = `export type ThemePickerProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> & {
  value: string
  onChange: (theme: string) => void
  themes: readonly ThemeOption[]
  /** Accessible name for the control. */
  label?: string
}`

const themeToggleProps = [
  {
    name: 'value',
    type: "'system' | 'light' | 'dark'",
    required: true,
    description: "The selected preference. Pair with useColorScheme's `preference`.",
  },
  {
    name: 'onChange',
    type: "(preference: 'system' | 'light' | 'dark') => void",
    required: true,
    description: 'Called when the reader selects a different option.',
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Color scheme'",
    description: 'Accessible name for the radiogroup.',
  },
  {
    name: 'showLabels',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Render text labels beside the icons instead of icon-only buttons.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional classes for the radiogroup root.',
  },
]

const themePickerProps = [
  {
    name: 'value',
    type: 'string',
    required: true,
    description: "The active theme's value. Pair with useThemeName's `theme`.",
  },
  {
    name: 'onChange',
    type: '(theme: string) => void',
    required: true,
    description: 'Called with the new theme value when the reader picks one.',
  },
  {
    name: 'themes',
    type: 'readonly ThemeOption[]',
    required: true,
    description:
      "The available options ({ value, label }). Not known by the hook — it's a property of which theme stylesheets the app imported.",
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Theme'",
    description: 'Accessible name for the control.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional classes for the <select> element.',
  },
]

const useColorSchemeReturns = [
  {
    name: 'preference',
    type: "'system' | 'light' | 'dark'",
    description: 'The stored three-state choice.',
  },
  {
    name: 'resolved',
    type: "'light' | 'dark'",
    description: '`preference` with `system` collapsed to whatever the OS actually reports.',
  },
  {
    name: 'setPreference',
    type: "(preference: 'system' | 'light' | 'dark') => void",
    description: 'Persists the choice to localStorage and stamps `<html data-scheme>`.',
  },
]

const useThemeNameReturns = [
  {
    name: 'theme',
    type: 'string',
    description: 'The active palette family name.',
  },
  {
    name: 'setTheme',
    type: '(theme: string) => void',
    description: 'Persists the choice to localStorage and stamps `<html data-theme>`.',
  },
]

export function ThemeDoc() {
  const { preference, setPreference } = useColorScheme()
  const { theme, setTheme } = useThemeName()

  return (
    <DocsPage
      route="components/theme"
      title="Theme"
      intro={
        <>
          Two independent axes, both driven by <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">data-*</code> attributes
          on <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">&lt;html&gt;</code>: <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">data-scheme</code> (light/dark)
          and <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">data-theme</code> (palette family).{' '}
          <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">useColorScheme</code>/
          <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">useThemeName</code> own the state
          and persist it; <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">ThemeToggle</code>/
          <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">ThemePicker</code> are the
          controlled components that render it. Every page on this site uses exactly this pair,
          wrapped as <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">ThemeControls</code>, in
          its header — see the README's <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">## Theming</code> section
          for the token contract and anti-flash script this page doesn't repeat.
        </>
      }
    >
      <DocsSection
        id="preview"
        title="Preview"
        description={
          <>
            <code>ThemeToggle</code> is a three-state radiogroup — light / system / dark —
            implemented as one tab stop with arrow-key navigation; <code>showLabels</code> switches
            between icon-only and labeled. <code>ThemePicker</code> is a native{' '}
            <code>&lt;select&gt;</code> over whichever theme stylesheets the app imported.
          </>
        }
      >
        <div className="space-y-6">
          <DocsDemo code={previewDemoCode}>
            <div className="flex flex-wrap items-center gap-8">
              <ThemeToggle value={preference} onChange={setPreference} />
              <ThemeToggle value={preference} onChange={setPreference} showLabels />
            </div>
          </DocsDemo>
          <DocsPreview>
            <ThemePicker value={theme} onChange={setTheme} themes={THEMES} />
          </DocsPreview>
          <DocsCallout variant="note" title="ThemePicker doesn't know what themes exist">
            The list is always passed in — it's a property of which theme stylesheets the app
            imported. It's also hidden below the <code>sm</code> breakpoint inside the header's{' '}
            <code>ThemeControls</code> to save space; shown here at full size.
          </DocsCallout>
          <DocsCallout variant="note" title="The Catppuccin flavors pin their scheme">
            <code>tint</code>, <code>solarized</code>, and <code>gruvbox</code> pair a light and a
            dark value per token with <code>light-dark()</code>, so the toggle above flips them. A
            Catppuccin flavor is already a complete palette, so each of the four commits to its own
            colors and the toggle moves only the native chrome — scrollbars, form controls, focus
            rings. Pick <code>latte</code> for light and <code>mocha</code> for dark.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <div className="space-y-6">
          <p className="m-0 max-w-3xl text-sm leading-6 text-tint-muted">
            Wire both controlled components to their hooks — the hooks own persistence and the{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">data-*</code>{' '}
            attributes, the components just render the state.
          </p>
          <CodeBlock code={usageCode} language="tsx" />
        </div>
      </DocsSection>

      <DocsSection id="api" title="API" description="Required props are marked with an asterisk.">
        <div className="space-y-10">
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">ThemeToggle</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <CodeBlock code={themeToggleSignature} language="tsx" className="mb-4" />
            <PropsTable rows={themeToggleProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">ThemePicker</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <CodeBlock code={themePickerSignature} language="tsx" className="mb-4" />
            <PropsTable rows={themePickerProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              useColorScheme()
            </h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">No parameters. Returns:</p>
            <PropsTable rows={useColorSchemeReturns} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              useThemeName()
            </h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">No parameters. Returns:</p>
            <PropsTable rows={useThemeNameReturns} />
          </div>
        </div>
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
