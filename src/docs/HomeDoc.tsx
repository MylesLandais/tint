import {
  Database,
  MessageSquare,
  Package,
  Palette,
  Play,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { Check, Copy } from 'lucide-react'
import { DOC_GROUPS, DOC_ROUTES, ROUTE_GROUPS, hrefFor, type DocGroup } from './routes'
import { CodeBlock } from './components/CodeBlock'
import { Icon } from '../components/icon'
import { useCopied } from '../lib/useCopied'

const GROUP_ICONS: Record<DocGroup, LucideIcon> = {
  Media: Play,
  'Chat & content': MessageSquare,
  'Data & infra': Database,
  'Theming & layout': Palette,
  Meta: Waypoints,
}

const INSTALL_SNIPPET = `npm install tint`

const HERO_USAGE = `import { MediaPlayer } from 'tint/media-player'
import 'tint/styles.css'

export function NowPlaying() {
  return (
    <MediaPlayer
      kind="audio"
      src={track.url}
      label={\`\${track.title} by \${track.artist}\`}
      title={track.title}
      artist={track.artist}
    />
  )
}`

/**
 * The component index at `#/` — the site's discovery surface.
 *
 * Hero first (what tint is + install), then every component as a card grouped
 * the same way the sidebar groups them. Cards come straight from `DOC_ROUTES`,
 * so a new entry there shows up here without touching this file.
 */
export function HomeDoc() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <section className="mb-12 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Component library
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Rich interfaces, controlled by your app
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Tint is a set of composable React components for media, chat, and data surfaces. They
            stay controlled — your application owns the state, Tint owns the interaction — and every
            one themes from the same token set in light and dark across every palette. This
            site is itself built from Tint components fed with local mock data.
          </p>
          <InstallButton />
        </section>

        <section aria-labelledby="quickstart-heading" className="mb-14 max-w-3xl">
          <h2
            id="quickstart-heading"
            className="mt-0 mb-3 text-xl font-semibold tracking-tight text-tint-ink"
          >
            Quickstart
          </h2>
          <CodeBlock code={HERO_USAGE} />
        </section>

        {DOC_GROUPS.map((group) => (
          <section key={group} aria-labelledby={`group-${group}`} className="mb-10">
            <h2
              id={`group-${group}`}
              className="mt-0 mb-4 flex items-center gap-2 text-sm font-semibold text-tint-ink"
            >
              <span className="text-tint-muted">
                <Icon icon={GROUP_ICONS[group]} size="sm" />
              </span>
              {group}
            </h2>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {DOC_ROUTES.filter((route) => ROUTE_GROUPS[route.path] === group).map((route) => (
                <li key={route.path}>
                  <a
                    href={hrefFor(route)}
                    className="group flex h-full flex-col gap-2 rounded-2xl border border-tint-border bg-tint-panel p-5 transition hover:border-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
                  >
                    <span className="text-base font-semibold tracking-tight text-tint-ink group-hover:text-tint-accent">
                      {route.label}
                    </span>
                    <span className="text-sm leading-6 text-tint-muted">{route.blurb}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

/** Heroicons-style one-click install, right in the hero. */
function InstallButton() {
  const { copied, copy } = useCopied(INSTALL_SNIPPET)
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-tint-border bg-tint-panel px-4 py-2 font-mono text-sm text-tint-ink transition-colors hover:border-tint-border-strong"
    >
      <Icon icon={Package} size="sm" className="text-tint-muted" />
      {INSTALL_SNIPPET}
      <span className="text-tint-muted">
        <Icon icon={copied ? Check : Copy} size="sm" />
      </span>
    </button>
  )
}
