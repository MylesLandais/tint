import { useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bot,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleDashed,
  Clock3,
  Code2,
  Columns3,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Globe2,
  ImageIcon,
  LoaderCircle,
  MessageCircle,
  Monitor,
  Moon,
  Music2,
  Palette,
  Paperclip,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Square,
  Sun,
  Terminal,
  User,
  Volume1,
  Volume2,
  VolumeX,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import { Icon, StatusIcon, Spinner, ICON_SIZES, STATUS_ICONS } from '../components/icon'
import type { IconSize, StatusName } from '../components/icon'
import { DiceRoller, D10, D20 } from '../components/dice'
import type { DiceKind } from '../components/dice'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'

const usageCode = `import { Icon, StatusIcon, Spinner } from 'tint/icon'
import { Search } from 'lucide-react'

export function Example() {
  return (
    <>
      <Icon icon={Search} size="sm" />
      <StatusIcon status="success" />
      <Spinner size="sm" />
    </>
  )
}`

const previewDemoCode = `import { Icon, StatusIcon, Spinner } from 'tint/icon'
import { Search } from 'lucide-react'

<Icon icon={Search} size="sm" />
<StatusIcon status="success" />
<Spinner size="sm" />`

const SIZE_PX: Record<IconSize, string> = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
}

const SIZES = Object.keys(ICON_SIZES) as IconSize[]

const STATUSES = Object.keys(STATUS_ICONS) as StatusName[]

/** Every glyph the shipped component library itself renders — not lucide's whole catalog. */
const GALLERY: readonly [string, typeof Search][] = [
  ['AlertCircle', AlertCircle],
  ['ArrowDown', ArrowDown],
  ['ArrowUp', ArrowUp],
  ['Bot', Bot],
  ['Brain', Brain],
  ['CalendarDays', CalendarDays],
  ['Check', Check],
  ['CheckCircle2', CheckCircle2],
  ['ChevronDown', ChevronDown],
  ['ChevronLeft', ChevronLeft],
  ['ChevronRight', ChevronRight],
  ['ChevronsUpDown', ChevronsUpDown],
  ['CircleDashed', CircleDashed],
  ['Clock3', Clock3],
  ['Code2', Code2],
  ['Columns3', Columns3],
  ['Copy', Copy],
  ['ExternalLink', ExternalLink],
  ['Eye', Eye],
  ['EyeOff', EyeOff],
  ['File', File],
  ['FileText', FileText],
  ['Globe2', Globe2],
  ['ImageIcon', ImageIcon],
  ['LoaderCircle', LoaderCircle],
  ['MessageCircle', MessageCircle],
  ['Monitor', Monitor],
  ['Moon', Moon],
  ['Music2', Music2],
  ['Palette', Palette],
  ['Paperclip', Paperclip],
  ['RotateCcw', RotateCcw],
  ['Search', Search],
  ['Settings', Settings],
  ['ShieldCheck', ShieldCheck],
  ['Shuffle', Shuffle],
  ['Square', Square],
  ['Sun', Sun],
  ['Terminal', Terminal],
  ['User', User],
  ['Volume1', Volume1],
  ['Volume2', Volume2],
  ['VolumeX', VolumeX],
  ['Wrench', Wrench],
  ['X', X],
  ['XCircle', XCircle],
]

const iconProps = [
  {
    name: 'icon',
    type: 'ComponentType<SVGProps<SVGSVGElement>>',
    required: true,
    description: 'The icon component to render, e.g. `Search` from `lucide-react`.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    defaultValue: "'md'",
    description: 'Maps to the fixed size-token scale shown above.',
  },
  {
    name: 'label',
    type: 'string',
    description:
      'Accessible name. Omit for decorative icons — the default, since call sites pair icons with visible or aria-labelled text.',
  },
]

const statusIconProps = [
  {
    name: 'status',
    type: STATUSES.map((name) => `'${name}'`).join(' | '),
    required: true,
    description: 'Looked up in the shared registry for its icon, label, and tone.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    defaultValue: "'md'",
    description: 'Same scale as `Icon`.',
  },
  {
    name: 'label',
    type: 'string',
    description: 'Accessible name. Omit for decorative icons — the default.',
  },
]

const diceRollerProps = [
  {
    name: 'kind',
    type: "'d6' | 'd10' | 'd20'",
    defaultValue: "'d6'",
    description: 'Which die to render.',
  },
  {
    name: 'value',
    type: 'number',
    required: true,
    description: 'The settled face to display while not rolling.',
  },
  {
    name: 'rolling',
    type: 'boolean',
    defaultValue: 'false',
    description: 'True while a roll is in flight — the die free-spins until this flips back.',
  },
  {
    name: 'onRoll',
    type: '() => void',
    description: 'Fired when the trigger is activated; the app owns the randomness.',
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Roll'",
    description: 'Accessible/visible label for the roll trigger.',
  },
]

const iconSignature = `type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  /** The icon component to render, e.g. \`Search\` from \`lucide-react\`. */
  icon: IconGlyph
  size?: IconSize
  /**
   * Accessible name. Omit for decorative icons — the default everywhere
   * today, since every call site pairs its icon with visible or
   * aria-labelled text rather than labeling the icon itself.
   */
  label?: string
}`

const statusIconSignature = `type StatusIconProps = Omit<IconProps, 'icon'> & {
  status: StatusName
}

// Spinner takes Omit<StatusIconProps, 'status'> — the same component
// pinned to status="loading", minus the registry's tone.`

const diceRollerSignature = `type DiceRollerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  /** Which die to render. */
  kind?: DiceKind
  /** The settled face to display while not rolling. */
  value: number
  /**
   * True while a roll is in flight — the die free-spins through random faces
   * until this flips back to \`false\`, at which point it settles on \`value\`.
   * A controlled flag rather than inferring "rolling" from \`value\` changing,
   * so a roll that lands on the same face it started on still animates.
   */
  rolling?: boolean
  /** Fired when the roll trigger is activated; the app owns the randomness. */
  onRoll?: () => void
  /** Accessible/visible label for the roll trigger. */
  label?: string
}`

const diceUsageCode = `import { DiceRoller } from 'tint/dice'
import { useState } from 'react'

export function Example() {
  const [value, setValue] = useState(12)
  const [rolling, setRolling] = useState(false)

  function roll() {
    setRolling(true)
    // Owned by the app: a local RNG, a server call, a seeded replay — the
    // component only visualizes the transition.
    setTimeout(() => {
      setValue(1 + Math.floor(Math.random() * 20))
      setRolling(false)
    }, 650)
  }

  return <DiceRoller kind="d20" value={value} rolling={rolling} onRoll={roll} />
}`

const DEMO_FACE_COUNT: Record<DiceKind, number> = { d6: 6, d10: 10, d20: 20 }

/** Doc-only: owns the roll state so each die on this page can be tried independently. */
function DiceRollerDemo({ kind }: { kind: DiceKind }) {
  const [value, setValue] = useState(() => 1 + Math.floor(Math.random() * DEMO_FACE_COUNT[kind]))
  const [rolling, setRolling] = useState(false)

  const roll = () => {
    setRolling(true)
    window.setTimeout(() => {
      setValue(1 + Math.floor(Math.random() * DEMO_FACE_COUNT[kind]))
      setRolling(false)
    }, 650)
  }

  return <DiceRoller kind={kind} value={value} rolling={rolling} onRoll={roll} label={kind} />
}

export function IconsDoc() {
  return (
    <DocsPage
      route="components/icon"
      title="Icons"
      intro={
        <>
          Every icon in tint renders through one seam: <code>Icon</code>, a thin wrapper around{' '}
          <code>lucide-react</code> — the library's one and only icon dependency — with a fixed
          size scale and a consistent decorative-by-default accessibility posture.{' '}
          <code>StatusIcon</code> layers a semantic status registry (loading, success, error, …)
          on top, reused across chat, table, and media-player rather than reimplemented per
          feature.
        </>
      }
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="The three entry points side by side: a wrapped lucide glyph, a registry-backed status, and the loading spinner shortcut."
      >
        <DocsDemo code={previewDemoCode}>
          <div className="flex items-center gap-4">
            <Icon icon={Search} size="sm" />
            <StatusIcon status="success" />
            <Spinner size="sm" />
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            Icons are decorative by default: omit <code>label</code> and the glyph is hidden from
            assistive technology, on the assumption that call sites pair icons with visible or
            aria-labelled text. Pass <code>label</code> only when the icon stands alone.
          </>
        }
      >
        <div className="space-y-6">
          <CodeBlock code={usageCode} />
          <DocsCallout variant="note" title="Decorative by default">
            This posture is deliberate — most icons sit next to text that already names the
            action, so announcing the glyph too would only add noise. The exception is the
            icon-only button, which needs <code>label</code> to stay accessible.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="sizes" title="Size scale">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SIZES.map((size) => (
            <div
              key={size}
              className="flex flex-col items-center gap-3 rounded-xl border border-tint-border bg-tint-panel p-5"
            >
              <Icon icon={Wrench} size={size} />
              <div className="text-center">
                <div className="font-mono text-sm font-medium text-tint-ink">{size}</div>
                <div className="mt-0.5 font-mono text-xs text-tint-muted">
                  {ICON_SIZES[size]} · {SIZE_PX[size]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="status"
        title="Status registry"
        description={
          <>
            A loading spinner, a success check, a failure mark — the same handful of states recur
            across every feature that reports progress. <code>StatusIcon</code> and its{' '}
            <code>Spinner</code> shortcut read from this one registry instead of each component
            keeping its own icon/tone map.
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="flex items-center gap-3 rounded-xl border border-tint-border bg-tint-panel p-4"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint-surface ${STATUS_ICONS[status].tone}`}
              >
                <StatusIcon status={status} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-tint-ink">
                  {STATUS_ICONS[status].label}
                </div>
                <div className="font-mono text-xs text-tint-muted">{status}</div>
              </div>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="vocabulary"
        title="Icon vocabulary"
        description="Every glyph the shipped component library renders today — not lucide's entire catalog, just the vocabulary tint itself uses."
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {GALLERY.map(([name, glyph]) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-lg border border-tint-border bg-tint-panel p-3"
            >
              <Icon icon={glyph} size="lg" />
              <span className="truncate text-[0.6875rem] text-tint-muted">{name}</span>
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="extending"
        title="Extending past lucide"
        description={
          <>
            lucide ships <code>Dice1</code>–<code>Dice6</code>, but nothing for a ten- or
            twenty-sided die — those aren't in its catalog. <code>Icon</code> doesn't care where a
            glyph comes from: it accepts anything shaped like{' '}
            <code>ComponentType&lt;SVGProps&lt;SVGSVGElement&gt;&gt;</code>, so a hand-authored SVG
            drawn to lucide's own conventions — 24×24 viewBox, 2px stroke, round joins — slots in
            exactly the same way as a lucide import. <code>DiceRoller</code> below is the worked
            example.
          </>
        }
      >
        <div className="mb-6 flex gap-3">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-tint-border bg-tint-panel p-3">
            <Icon icon={D10} size="lg" />
            <span className="text-[0.6875rem] text-tint-muted">D10 (custom)</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-tint-border bg-tint-panel p-3">
            <Icon icon={D20} size="lg" />
            <span className="text-[0.6875rem] text-tint-muted">D20 (custom)</span>
          </div>
        </div>

        <DocsDemo code={diceUsageCode}>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
            <DiceRollerDemo kind="d6" />
            <DiceRollerDemo kind="d10" />
            <DiceRollerDemo kind="d20" />
          </div>
        </DocsDemo>

        <div className="mt-6">
          <DocsCallout variant="note" title="Controlled, like every tint component">
            The app owns the random result and reports intent through <code>onRoll</code> — the
            die free-spins while <code>rolling</code> is true and settles on{' '}
            <code>value</code> when it flips back. The component only visualizes the transition.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API" description="Required props are marked with an asterisk.">
        <div className="space-y-10">
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">Icon</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <div className="mb-3">
              <CodeBlock code={iconSignature} language="tsx" />
            </div>
            <PropsTable rows={iconProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">StatusIcon</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">Spinner</code>{' '}
              is the same component pinned to{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">status=&quot;loading&quot;</code>,
              minus the registry's tone — every existing spinner call site inherits its
              surrounding text color rather than a fixed info-blue. The full prop signatures, from
              the source:
            </p>
            <div className="mb-3">
              <CodeBlock code={statusIconSignature} language="tsx" />
            </div>
            <PropsTable rows={statusIconProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">DiceRoller</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <div className="mb-3">
              <CodeBlock code={diceRollerSignature} language="tsx" />
            </div>
            <PropsTable rows={diceRollerProps} />
          </div>
        </div>
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
