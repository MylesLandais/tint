import { ThemePicker, ThemeToggle, useColorScheme, useThemeName } from '../components/theme'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import { DocsNav } from './components/DocsNav'

const THEMES = [
  { value: 'tint', label: 'Tint' },
  { value: 'solarized', label: 'Solarized' },
  { value: 'gruvbox', label: 'Gruvbox' },
] as const

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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <DocsNav current="components/theme" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Design language
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Theme
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
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
          </p>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Color scheme
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            A three-state radiogroup — light / system / dark — implemented as one tab stop with
            arrow-key navigation. <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">showLabels</code> switches
            between icon-only and labeled.
          </p>
          <div className="flex flex-wrap items-center gap-8 rounded-xl border border-tint-border bg-tint-panel p-6">
            <ThemeToggle value={preference} onChange={setPreference} />
            <ThemeToggle value={preference} onChange={setPreference} showLabels />
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Palette family
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            A native <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">&lt;select&gt;</code> over
            whichever theme stylesheets the app imported —{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">ThemePicker</code> doesn't know
            what themes exist, the list is always passed in. It's hidden below the{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">sm</code> breakpoint inside the
            header's <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">ThemeControls</code> to
            save space; shown here at full size.
          </p>
          <div className="flex items-center gap-6 rounded-xl border border-tint-border bg-tint-panel p-6">
            <ThemePicker value={theme} onChange={setTheme} themes={THEMES} />
          </div>
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="scroll-mt-24 space-y-10">
          <div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Required props are marked with an asterisk.
            </p>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">ThemeToggle</h3>
            <PropsTable rows={themeToggleProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">ThemePicker</h3>
            <PropsTable rows={themePickerProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">useColorScheme()</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">No parameters. Returns:</p>
            <PropsTable rows={useColorSchemeReturns} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">useThemeName()</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">No parameters. Returns:</p>
            <PropsTable rows={useThemeNameReturns} />
          </div>
        </section>
      </div>
    </main>
  )
}
