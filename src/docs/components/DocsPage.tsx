import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Code, Copy, FileText, Lightbulb, TriangleAlert } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { Icon } from '../../components/icon'
import { cn } from '../../lib/utils'
import { useCopied } from '../../lib/useCopied'
import { DOC_ROUTES, findRoute, hrefFor, type DocRoutePath } from '../routes'

/**
 * The headline import for each page, docs.rs-style: the H1 offers one click to
 * copy it. Names come from each component's real `index.ts` exports.
 */
const IMPORT_SNIPPETS = {
  'components/media-player': "import { MediaPlayer } from 'tint/media-player'",
  'components/video-player': "import { VideoPlayer } from 'tint/video-player'",
  'components/media': "import { Slider, VolumeControl, Waveform } from 'tint/media'",
  'components/audio-input': "import { AudioInput } from 'tint/audio-input'",
  'components/settings-popout': "import { SettingsPopout } from 'tint/settings-popout'",
  'components/chat': "import { ChatConversation } from 'tint/chat'",
  'components/editor': "import { Editor } from 'tint/editor'",
  'components/code': "import { HighlightedCode, CodeTabs } from 'tint/code'",
  'components/terminal': "import { TerminalConsole } from 'tint/terminal'",
  'components/table': "import { DataTable } from 'tint/table'",
  'components/chrome': "import { Dialog, ProgressBar, Badge, ContextMenu, TreeView, ToastProvider } from 'tint'",
  'components/graph': "import { InteractiveGraphView } from 'tint/graph'",
  'components/socket': "import type { Socket, SocketSpec } from 'tint/socket'",
  'components/collab': "import { createCollabSession } from 'tint/collab'",
  'components/auth': "import { AuthProvider, SignInForm } from 'tint/auth'",
  'components/theme': "import { ThemePicker, ThemeToggle } from 'tint/theme'",
  'components/panel': "import { Panel } from 'tint/panel'",
  'components/icon': "import { Icon, StatusIcon } from 'tint/icon'",
  'components/dice': "import { DiceRoller } from 'tint/dice'",
  'components/form': "import { FormLayout, TextField, SelectField } from 'tint/form'",
  'components/character-card': "import { CharacterCardEditorForm } from 'tint/character-card'",
  'graph': "import { InteractiveGraphView } from 'tint/graph'",
} satisfies Record<DocRoutePath, string>

export type DocsPageProps = {
  route: DocRoutePath
  title: string
  /** One-paragraph statement of what the component is for. */
  intro: ReactNode
  /** Optional second paragraph for caveats and limitations. */
  note?: ReactNode
  /** Widen the content column for demos that need the room (e.g. Table). */
  wide?: boolean
  children: ReactNode
}

/**
 * The content frame every docs page shares: eyebrow, title, intro, page
 * actions, and prev/next pager.
 *
 * Page chrome (header, sidebar, TOC) belongs to `DocsShell`; this is only the
 * content column. Keeping it in one place is what lets a change to the page
 * furniture land everywhere at once, the same argument `routes.ts` makes for
 * the nav.
 */
export function DocsPage({ route, title, intro, note, wide, children }: DocsPageProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className={cn('mx-auto', wide ? 'max-w-[1440px]' : 'max-w-[1200px]')}>
        <section className="mb-8 max-w-3xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
              Components
            </p>
            <PageActions route={route} title={title} />
          </div>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            {title}
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">{intro}</p>
          {note ? <p className="mt-3 text-sm leading-6 text-tint-muted">{note}</p> : null}
        </section>
        {children}
        <DocsPager route={route} />
      </div>
    </main>
  )
}

/**
 * Mintlify's page-header action cluster: copy the import snippet (docs.rs's
 * "copy item path") or the whole page as markdown for an LLM prompt.
 */
function PageActions({ route, title }: { route: DocRoutePath; title: string }) {
  const data = findRoute(route)
  const importSnippet = IMPORT_SNIPPETS[route]
  const pageMarkdown = `# ${title}\n\n${data?.blurb ?? ''}\n\n${importSnippet}\n\nSections: ${
    data?.sections?.map((section) => section.label).join(', ') ?? '—'
  }\n\nFull interactive documentation: tint docs, ${data?.path ?? route}.`

  return (
    <span className="flex items-center gap-2">
      <ActionButton icon={Code} label="Copy import" value={importSnippet} />
      <ActionButton icon={FileText} label="Copy page" value={pageMarkdown} />
    </span>
  )
}

function ActionButton({
  icon,
  label,
  value,
}: {
  icon: typeof Copy
  label: string
  value: string
}) {
  const { copied, copy } = useCopied(value)
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-tint-border px-2.5 py-1.5 text-xs font-medium text-tint-muted transition-colors hover:bg-tint-surface hover:text-tint-ink"
    >
      <Icon icon={copied ? Check : icon} size="sm" />
      {copied ? 'Copied' : label}
    </button>
  )
}

/** LangChain/Mintlify-style prev/next cards, ordered by the route table. */
function DocsPager({ route }: { route: DocRoutePath }) {
  const index = DOC_ROUTES.findIndex((entry) => entry.path === route)
  const previous = index > 0 ? DOC_ROUTES[index - 1] : undefined
  const next = index >= 0 && index < DOC_ROUTES.length - 1 ? DOC_ROUTES[index + 1] : undefined
  if (!previous && !next) return null

  return (
    <nav aria-label="More components" className="mt-14 grid gap-4 sm:grid-cols-2">
      {previous ? (
        <a
          href={hrefFor(previous)}
          className="group rounded-xl border border-tint-border px-4 py-3 transition-colors hover:border-tint-accent"
        >
          <span className="flex items-center gap-1 text-xs text-tint-muted">
            <Icon icon={ArrowLeft} size="sm" /> Previous
          </span>
          <span className="mt-1 block text-sm font-semibold text-tint-ink group-hover:text-tint-accent">
            {previous.label}
          </span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a
          href={hrefFor(next)}
          className="group rounded-xl border border-tint-border px-4 py-3 text-right transition-colors hover:border-tint-accent"
        >
          <span className="flex items-center justify-end gap-1 text-xs text-tint-muted">
            Next <Icon icon={ArrowRight} size="sm" />
          </span>
          <span className="mt-1 block text-sm font-semibold text-tint-ink group-hover:text-tint-accent">
            {next.label}
          </span>
        </a>
      ) : null}
    </nav>
  )
}

/** A titled, anchored section — the unit `routes.ts` offers as a jump link. */
export function DocsSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="mt-0 mb-3 text-xl font-semibold tracking-tight text-tint-ink">{title}</h2>
      {description ? (
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted [&_code]:rounded [&_code]:bg-tint-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-tint-ink">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  )
}

/** The bordered surface live examples sit on across the docs site. */
export function DocsPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-tint-border bg-tint-panel p-4 shadow-sm sm:p-6 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

export type DocsDemoProps = {
  /** The snippet the "Show code" toggle reveals — trimmed to what the demo proves. */
  code: string
  language?: string
  children: ReactNode
  className?: string
}

/**
 * A live demo with its source attached, MUI-style: the rendered example sits on
 * top, and a "Show code" bar below expands to the snippet that produces it. The
 * expanded block is a full `CodeBlock`, so the copy button comes along for free.
 */
export function DocsDemo({ code, language = 'tsx', children, className }: DocsDemoProps) {
  const [showCode, setShowCode] = useState(false)

  return (
    <div className={cn('overflow-hidden rounded-xl border border-tint-border shadow-sm', className)}>
      <div className="bg-tint-panel p-4 sm:p-6">{children}</div>
      <div className="flex justify-end border-t border-tint-border bg-tint-surface px-3 py-1.5">
        <button
          type="button"
          onClick={() => setShowCode((open) => !open)}
          aria-expanded={showCode}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-tint-muted transition-colors hover:bg-tint-panel hover:text-tint-ink"
        >
          <Icon icon={Code} size="sm" />
          {showCode ? 'Hide code' : 'Show code'}
        </button>
      </div>
      {showCode ? (
        <CodeBlock code={code} language={language} className="rounded-none border-x-0 border-b-0" />
      ) : null}
    </div>
  )
}

export type DocsCalloutProps = {
  /** `note` for design intent, `warning` for footguns. */
  variant?: 'note' | 'warning'
  title?: string
  children: ReactNode
}

/**
 * A TanStack-style admonition for the things a props table can't say: autoplay
 * policies, controlled-state contracts, demo-only shortcuts.
 */
export function DocsCallout({ variant = 'note', title, children }: DocsCalloutProps) {
  const warning = variant === 'warning'
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6',
        warning
          ? 'border-tint-danger/40 bg-tint-danger/5 text-tint-ink'
          : 'border-tint-accent/30 bg-tint-accent/5 text-tint-ink',
      )}
    >
      <span className={cn('mt-0.5 shrink-0', warning ? 'text-tint-danger' : 'text-tint-accent')}>
        <Icon icon={warning ? TriangleAlert : Lightbulb} size="sm" />
      </span>
      <div>
        {title ? <p className="m-0 mb-1 font-semibold">{title}</p> : null}
        <div className="text-tint-muted [&_code]:rounded [&_code]:bg-tint-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-tint-ink">
          {children}
        </div>
      </div>
    </div>
  )
}

/** The footer every page ends with; the right slot is for per-page credits. */
export function DocsFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="mt-14 border-t border-tint-border py-8">
      <div className="flex flex-col gap-2 text-sm text-tint-muted sm:flex-row sm:items-center sm:justify-between">
        <span>tint · React component library</span>
        {children}
      </div>
    </footer>
  )
}

export type DocsTab = { id: string; label: string }

export type DocsTabsProps = {
  tabs: readonly DocsTab[]
  active: string
  onChange: (id: string) => void
  /** Accessible label for the tab list, e.g. "Media kind". */
  label: string
}

/**
 * Underline-style tabs (Mintlify pattern) for switching *scenarios* within a
 * page — audio vs. video, grid vs. masonry. LangChain's rule applies: tabs
 * switch scenarios, routes switch pages; never mix the two axes.
 */
export function DocsTabs({ tabs, active, onChange, label }: DocsTabsProps) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-4 border-b border-tint-border">
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 pb-2 text-sm font-semibold transition-colors',
              selected
                ? 'border-tint-accent text-tint-accent'
                : 'border-transparent text-tint-muted hover:border-tint-border-strong hover:text-tint-ink',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
