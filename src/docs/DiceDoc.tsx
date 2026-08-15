import { useState } from 'react'
import { DiceRoller } from '../components/dice'
import type { DiceKind } from '../components/dice'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const previewDemoCode = `const [value, setValue] = useState(20)
const [rolling, setRolling] = useState(false)

const roll = () => {
  setRolling(true)
  // The app owns the randomness; tint only animates and reports intent.
  window.setTimeout(() => {
    setValue(1 + Math.floor(Math.random() * 20))
    setRolling(false)
  }, 700)
}

<DiceRoller kind="d20" value={value} rolling={rolling} onRoll={roll} />`

const usageCode = `import { DiceRoller } from 'tint/dice'

const [value, setValue] = useState(1)
const [rolling, setRolling] = useState(false)

async function roll() {
  setRolling(true)
  // The app owns the randomness — seeded, server-authoritative, whatever.
  const next = await api.roll('d20')
  setValue(next)
  setRolling(false)
}

<DiceRoller kind="d20" value={value} rolling={rolling} onRoll={roll} />`

const glyphUsageCode = `import { Icon } from 'tint/icon'
import { D20 } from 'tint/dice'

// lucide ships Dice1–Dice6 but no d10/d20, so those two faces are
// hand-authored glyphs rendered through the same Icon seam.
<Icon icon={D20} size="xl" />`

const signatureCode = `type DiceKind = 'd6' | 'd10' | 'd20'

type DiceRollerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  /** Which die to render. */
  kind?: DiceKind
  /** The settled face to display while not rolling. */
  value: number
  /** True while a roll is in flight; settles on \`value\` when it flips back. */
  rolling?: boolean
  /** Fired when the roll trigger is activated; the app owns the randomness. */
  onRoll?: () => void
  /** Accessible/visible label for the roll trigger. */
  label?: string
}`

const props = [
  { name: 'value', type: 'number', required: true, description: 'The settled face. Rendered whenever `rolling` is false.' },
  { name: 'onRoll', type: '() => void', description: 'Reports intent only. The app produces the next value and clears `rolling`.' },
  { name: 'kind', type: "'d6' | 'd10' | 'd20'", defaultValue: "'d6'", description: 'Face count and which glyph renders. d6 uses lucide’s pips; d10/d20 use tint’s own outlines with a numeric face.' },
  { name: 'rolling', type: 'boolean', defaultValue: 'false', description: 'Animates the die and disables the button. Reduced motion skips the flicker but still lands on the result.' },
  { name: 'label', type: 'string', defaultValue: "'Roll'", description: 'Visible text on the roll button.' },
  { name: 'className', type: 'string', description: 'Extra classes for the wrapper.' },
]

const KINDS: DiceKind[] = ['d6', 'd10', 'd20']
const FACES: Record<DiceKind, number> = { d6: 6, d10: 10, d20: 20 }

export function DiceDoc() {
  const [kind, setKind] = useState<DiceKind>('d20')
  const [value, setValue] = useState(20)
  const [rolling, setRolling] = useState(false)

  const roll = () => {
    setRolling(true)
    window.setTimeout(() => {
      setValue(1 + Math.floor(Math.random() * FACES[kind]))
      setRolling(false)
    }, 700)
  }

  return (
    <DocsPage
      route="components/dice"
      title="Dice"
      intro="A controlled dice roller, and the library’s worked example of extending Icon past lucide’s catalog."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="Roll the die, or switch kinds to see each glyph. The roller never picks the number itself — the app answers onRoll with a new value."
      >
        <DocsDemo code={previewDemoCode}>
          <div className="flex flex-col items-center gap-5">
            <DiceRoller kind={kind} value={value} rolling={rolling} onRoll={roll} />
            <div role="group" aria-label="Die kind" className="flex gap-1">
              {KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setKind(option)
                    setValue(1)
                  }}
                  aria-pressed={kind === option}
                  className="rounded-md border border-tint-border px-3 py-1.5 text-xs font-medium text-tint-muted transition hover:bg-tint-surface aria-pressed:bg-tint-accent-soft aria-pressed:text-tint-accent focus-visible:outline-2 focus-visible:outline-tint-accent"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            <code>DiceRoller</code> is fully controlled: it renders <code>value</code>, animates
            while <code>rolling</code> is true, and fires <code>onRoll</code> when pressed.
          </>
        }
      >
        <div className="space-y-6">
          <CodeBlock code={usageCode} />
          <div>
            <h3 className="mb-3 text-base font-semibold text-tint-ink">The glyphs, on their own</h3>
            <p className="mb-3 max-w-3xl text-sm leading-6 text-tint-muted">
              The d10 and d20 faces are exported as standalone glyphs, so they can render anywhere
              an Icon can.
            </p>
            <CodeBlock code={glyphUsageCode} />
          </div>
          <DocsCallout variant="note" title="Tint does not generate the number">
            <code>onRoll</code> reports intent; the app answers by setting <code>rolling</code> and
            then the new <code>value</code>, which is what lets a roll be seeded, replayed, or
            server-authoritative.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API">
        <p className="mb-3 max-w-3xl text-sm leading-6 text-tint-muted">
          The full prop signature, from the source:
        </p>
        <CodeBlock code={signatureCode} className="mb-6" />
        <PropsTable rows={props} />
      </DocsSection>

      <DocsFooter>
        <span>d6 pips: Lucide · d10/d20 glyphs: tint</span>
      </DocsFooter>
    </DocsPage>
  )
}
