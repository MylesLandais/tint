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
import { Icon, StatusIcon, Spinner, ICON_SIZES, STATUS_ICONS } from '@/components/icon'
import type { IconSize, StatusName } from '@/components/icon'
import { DiceRoller, D10, D20 } from '@/components/dice'
import type { DiceKind } from '@/components/dice'
import { CodeBlock } from './components/CodeBlock'
import { PropsTable } from './components/PropsTable'
import { DocsNav } from './components/DocsNav'

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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <DocsNav current="components/icon" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Design language
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Icons
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Every icon in tint renders through one seam: <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">Icon</code>,
            a thin wrapper around <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">lucide-react</code> —
            the library's one and only icon dependency — with a fixed size scale and a
            consistent decorative-by-default accessibility posture.{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">StatusIcon</code> layers
            a semantic status registry (loading, success, error, …) on top, reused across
            chat, table, and video-player rather than reimplemented per feature.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-tint-ink">
            Size scale
          </h2>
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
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Status registry
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            A loading spinner, a success check, a failure mark — the same handful of states
            recur across every feature that reports progress. <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">StatusIcon</code> and
            its <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">Spinner</code> shortcut
            read from this one registry instead of each component keeping its own icon/tone map.
          </p>
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
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Icon vocabulary
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            Every glyph the shipped component library renders today — not lucide's entire
            catalog, just the vocabulary tint itself uses.
          </p>
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
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Extending past lucide
          </h2>
          <p className="mt-0 mb-5 max-w-3xl text-base leading-7 text-tint-muted">
            lucide ships <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">Dice1</code>–
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">Dice6</code>, but nothing
            for a ten- or twenty-sided die — those aren't in its catalog.{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">Icon</code> doesn't care
            where a glyph comes from: it accepts anything shaped like{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">
              ComponentType&lt;SVGProps&lt;SVGSVGElement&gt;&gt;
            </code>
            , so a hand-authored SVG drawn to lucide's own conventions — 24×24 viewBox, 2px
            stroke, round joins — slots in exactly the same way as a lucide import.{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">DiceRoller</code> below is
            the worked example: a controlled component, the same pattern as every other tint
            component, where the app owns the random result and reports intent through{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">onRoll</code>.
          </p>

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

          <div className="flex flex-col items-center gap-8 rounded-xl border border-tint-border bg-tint-panel p-8 sm:flex-row sm:justify-center sm:gap-12">
            <DiceRollerDemo kind="d6" />
            <DiceRollerDemo kind="d10" />
            <DiceRollerDemo kind="d20" />
          </div>
        </section>

        <section className="mb-14 max-w-3xl">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">
            DiceRoller usage
          </h2>
          <CodeBlock code={diceUsageCode} language="tsx" />
          <div className="mt-6">
            <PropsTable rows={diceRollerProps} />
          </div>
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <div className="mb-3 flex items-center gap-4 rounded-xl border border-tint-border bg-tint-panel p-4">
            <Icon icon={Search} size="sm" />
            <StatusIcon status="success" />
            <Spinner size="sm" />
          </div>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="scroll-mt-24 space-y-10">
          <div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Required props are marked with an asterisk.
            </p>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">Icon</h3>
            <PropsTable rows={iconProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-tint-ink">StatusIcon</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">Spinner</code>{' '}
              is the same component pinned to <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">status=&quot;loading&quot;</code>,
              minus the registry's tone — every existing spinner call site inherits its
              surrounding text color rather than a fixed info-blue.
            </p>
            <PropsTable rows={statusIconProps} />
          </div>
        </section>
      </div>
    </main>
  )
}
