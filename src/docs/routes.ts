/**
 * The docs site's route table — the single source of truth for what pages exist.
 *
 * Routing, `document.title`, the breadcrumb in `DocsNav`, and the cards on the
 * landing page all read from this list, so adding a page here makes it appear
 * everywhere at once. Before this existed, every page hardcoded its own partial
 * nav list and they drifted apart; the Editor and Terminal demos ended up
 * reachable only by hand-typing their URL hash.
 *
 * Deliberately data-only: `DocsNav` imports this to resolve a breadcrumb label,
 * and the page components import `DocsNav`, so holding component references here
 * too would close an import cycle. The path -> component map lives in `pages.tsx`.
 */
export type DocSection = { id: string; label: string }

/** The shape each literal entry below is checked against. */
type DocRouteShape = {
  /** Hash path without the leading `#/`. */
  path: string
  /** Breadcrumb text and landing-page card title. */
  label: string
  /** One-line description for the landing-page card. */
  blurb: string
  /** Retired paths that still resolve here, so old links keep working. */
  aliases?: readonly string[]
  /** `<section id>`s in the page body, offered as jump links in the nav. */
  sections?: readonly DocSection[]
}

const USAGE_AND_API: readonly DocSection[] = [
  { id: 'usage', label: 'Usage' },
  { id: 'api', label: 'API' },
]

const ROUTE_DATA = [
  {
    path: 'components/media-player',
    label: 'Media Player',
    blurb: 'One container-responsive surface for audio and video: transport, waveform seek, volume, and a settings popout.',
    aliases: ['components/audio-player', 'components/video-player'],
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'features', label: 'Features' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/chat',
    label: 'Chat',
    blurb: 'Message list, composer, and streaming-friendly primitives for conversational UI.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'features', label: 'Features' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/audio-input',
    label: 'Audio Input',
    blurb: 'Controlled microphone input with a host-supplied transcriber seam.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/table',
    label: 'Table',
    blurb: 'Sortable, filterable data grid with infinite rows and a masonry view.',
    aliases: ['components/music-library'],
    sections: USAGE_AND_API,
  },
  {
    path: 'components/editor',
    label: 'Editor',
    blurb: 'Controlled WYSIWYG buffer with slash commands, selection formatting, and Tiptap extensions.',
    sections: USAGE_AND_API,
  },
  {
    path: 'components/terminal',
    label: 'Terminal',
    blurb: 'Browser terminal emulator that renders VT output and forwards raw input to your runtime.',
    sections: USAGE_AND_API,
  },
  {
    path: 'components/collab',
    label: 'Collab',
    blurb: 'CRDT text sync over a vendored Yjs, with presence awareness and a pluggable transport.',
  },
  {
    path: 'components/auth',
    label: 'Auth',
    blurb: 'Sign-in form, OAuth buttons, and a session client with an injectable transport.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/icon',
    label: 'Icons',
    blurb: 'One seam over lucide-react, with a fixed size scale and a status glyph registry.',
    sections: USAGE_AND_API,
  },
  {
    path: 'components/theme',
    label: 'Theme',
    blurb: 'Two independent axes — light/dark scheme and palette family — driven by data attributes.',
    sections: USAGE_AND_API,
  },
] as const satisfies readonly DocRouteShape[]

/** Literal union of valid paths, so a typo in `<DocsNav current>` is a type error. */
export type DocRoutePath = (typeof ROUTE_DATA)[number]['path']

export type DocRoute = DocRouteShape & { path: DocRoutePath }

/**
 * Widened for consumption: the `as const` above is what derives `DocRoutePath`,
 * but reading `route.sections` off that union would fail on the entries that
 * omit it, so callers see the uniform shape.
 */
export const DOC_ROUTES: readonly DocRoute[] = ROUTE_DATA

/**
 * Resolves a hash path to its route, honouring retired aliases. The return type
 * keeps `path` narrowed to `DocRoutePath` so callers can index the page map.
 */
export function findRoute(path: string): DocRoute | undefined {
  return DOC_ROUTES.find(
    (route) => route.path === path || route.aliases?.some((alias) => alias === path),
  )
}

export function hrefFor(route: DocRoute): string {
  return `#/${route.path}`
}
