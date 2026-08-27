import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsPopout, type SettingsPopoutItem } from '../components/settings-popout'
import { Icon } from '../components/icon'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const previewDemoCode = `const [open, setOpen] = useState(false)
const [value, setValue] = useState('speed-2')

<div className="relative">
  <button onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open}>
    Player settings
  </button>
  <SettingsPopout
    isOpen={open}
    onOpenChange={setOpen}
    items={items}
    value={value}
    onSelect={setValue}
    label="Player settings"
  />
</div>`

const usage = `import { SettingsPopout } from 'tint/settings-popout'

const [open, setOpen] = useState(false)
const [speed, setSpeed] = useState('1')

<div className="relative">
  <button onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open}>
    Settings
  </button>
  <SettingsPopout
    isOpen={open}
    onOpenChange={setOpen}
    items={items}
    value={speed}
    onSelect={setSpeed}
    label="Player settings"
  />
</div>`

const props = [
  { name: 'isOpen', type: 'boolean', required: true, description: 'Whether the popout is visible.' },
  { name: 'onOpenChange', type: '(isOpen: boolean) => void', required: true, description: 'Called when the popout should open or close.' },
  { name: 'items', type: 'readonly SettingsPopoutItem[]', required: true, description: 'Selectable entries. An `group` on an item collects it under a heading.' },
  { name: 'value', type: 'string', description: 'Currently selected item id. Highlighted on open and marked with a check.' },
  { name: 'onSelect', type: '(id: string) => void', description: 'Called with the chosen id. The popout closes itself afterwards.' },
  { name: 'label', type: 'string', defaultValue: "'Settings'", description: 'Accessible name for the dialog and its listbox.' },
  { name: 'placeholder', type: 'string', defaultValue: "'Search settings…'", description: 'Search input placeholder.' },
  { name: 'footer', type: 'ReactNode', description: 'Replaces the default keyboard hints.' },
  { name: 'emptySearchText', type: 'ReactNode', defaultValue: "'No results'", description: 'Shown when the query matches nothing.' },
  { name: 'className', type: 'string', description: 'Extra classes for the panel.' },
]

const signature = `export type SettingsPopoutProps = {
  /** Whether the popout is visible. */
  isOpen: boolean
  /** Called when the popout should close. */
  onOpenChange: (isOpen: boolean) => void
  /** Selectable entries, optionally grouped. */
  items: readonly SettingsPopoutItem[]
  /** Currently selected id. Highlighted on open and marked with a check. */
  value?: string
  /** Called with the chosen id. The popout closes itself afterwards. */
  onSelect?: (id: string) => void
  /** Accessible name for the dialog and its listbox. */
  label?: string
  /** Search input placeholder. */
  placeholder?: string
  /** Replaces the default keyboard hints. */
  footer?: ReactNode
  /** Shown when the query matches nothing. */
  emptySearchText?: ReactNode
  /** Extra classes for the panel. */
  className?: string
}`

const ITEMS: SettingsPopoutItem[] = [
  { id: 'speed-0.5', label: '0.5x', group: 'Playback speed', description: 'Half speed' },
  { id: 'speed-1', label: '1x', group: 'Playback speed', description: 'Normal speed' },
  { id: 'speed-2', label: '2x', group: 'Playback speed', description: 'Double speed' },
  { id: 'quality-auto', label: 'Auto', group: 'Quality', shortcut: 'A' },
  { id: 'quality-1080', label: '1080p', group: 'Quality' },
  { id: 'captions', label: 'Captions', shortcut: 'C' },
]

export function SettingsPopoutDoc() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('speed-2')

  return (
    <DocsPage
      route="components/settings-popout"
      title="Settings Popout"
      intro="A searchable, keyboard-driven picker for grouped choices. It is what the video player’s gear button opens, and it works anywhere a short list needs filtering and a single selection."
    >
      <DocsSection id="preview" title="Preview">
        {/* Tall enough that the upward-opening popout stays inside the preview. */}
        <DocsDemo code={previewDemoCode}>
          <div className="flex min-h-[26rem] items-end justify-center">
            <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className="inline-flex items-center gap-2 rounded-md border border-tint-border bg-tint-panel px-3 py-2 text-sm text-tint-ink hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              <Icon icon={Settings} size="sm" />
              Player settings
            </button>
            <SettingsPopout
              isOpen={open}
              onOpenChange={setOpen}
              items={ITEMS}
              value={value}
              onSelect={setValue}
              label="Player settings"
            />
            </div>
          </div>
        </DocsDemo>
        <p className="mt-3 text-sm text-tint-muted">
          Selected: <code className="text-tint-accent">{value}</code>. Open it and press{' '}
          <kbd>Escape</kbd> — focus returns to the trigger rather than dropping to the
          page.
        </p>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="Fully controlled: it holds the search query and the keyboard cursor, and nothing else."
      >
        <CodeBlock code={usage} />
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-tint-border bg-tint-surface/60 p-4 text-sm leading-6 text-tint-muted">
            <strong className="font-semibold text-tint-ink">Keyboard.</strong> Focus lands
            in the search field on open. <kbd>↑</kbd>/<kbd>↓</kbd> move the cursor and wrap,{' '}
            <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends, <kbd>Enter</kbd> selects, and{' '}
            <kbd>Escape</kbd> closes and restores focus to whatever opened it.
          </div>
          <DocsCallout variant="warning" title="Needs a positioned ancestor">
            The popout is positioned absolutely against the nearest positioned ancestor, so
            wrap it and its trigger in a <code>relative</code> container — otherwise it
            anchors to some distant ancestor up the tree.
          </DocsCallout>
          <DocsCallout variant="note" title="Deliberately non-modal">
            It does not trap focus, and it does not claim <code>aria-modal</code>, which
            would tell a screen reader the rest of the page had gone away.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <p className="mb-3 text-sm leading-6 text-tint-muted">
          The full prop signature, from the source:
        </p>
        <div className="mb-6">
          <CodeBlock code={signature} language="tsx" />
        </div>
        <PropsTable rows={props} />
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
