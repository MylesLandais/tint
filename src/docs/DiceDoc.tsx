import { useState } from 'react'
import { DiceRoller } from '../components/dice'
import type { DiceKind } from '../components/dice'
import { CodeBlock } from './components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const usage = `import { DiceRoller } from 'tint/dice'

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

const glyphUsage = `import { Icon } from 'tint/icon'
import { D20 } from 'tint/dice'

// lucide ships Dice1–Dice6 but no d10/d20, so those two faces are
// hand-authored glyphs rendered through the same Icon seam.
<Icon icon={D20} size="xl" />`

const props = [
  { name: 'value', type: 'number', required: true, description: 'The settled face. Rendered whenever `rolling` is false.' },
  { name: 'onRoll', type: '() => void', required: true, description: 'Reports intent only. The app produces the next value and clears `rolling`.' },
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
      note={
        <>
          Tint does not generate the number. <code>onRoll</code> reports intent; the app
          answers by setting <code>rolling</code> and then the new <code>value</code>,
          which is what lets a roll be seeded, replayed, or server-authoritative.
        </>
      }
    >
      <DocsSection id="preview" title="Preview">
        <DocsPreview className="flex flex-col items-center gap-5">
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
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
        <h3 className="mt-8 mb-3 text-base font-semibold text-tint-ink">
          The glyphs, on their own
        </h3>
        <CodeBlock code={glyphUsage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable rows={props} />
      </DocsSection>
    </DocsPage>
  )
}
