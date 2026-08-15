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
    // `components/video-player` was an alias here while video had no page of its
    // own. It is a real route again, so it is not listed — an alias that shadows
    // a live path would make the page unreachable.
    aliases: ['components/audio-player'],
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
      { id: 'usage', label: 'Usage' },
      { id: 'features', label: 'Features' },
      { id: 'api', label: 'API' },
      { id: 'utilities', label: 'Utilities' },
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
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'features', label: 'Features' },
      { id: 'api', label: 'API' },
      { id: 'utilities', label: 'Utilities' },
    ],
  },
  {
    path: 'components/chrome',
    label: 'Chrome',
    blurb: 'Dialog, progress, context menu, tree, badge, and toast — overlays and feedback for dense data UIs.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/editor',
    label: 'Editor',
    blurb: 'Controlled WYSIWYG buffer with slash commands, selection formatting, and Tiptap extensions.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'polyglot-code', label: 'Polyglot code' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/terminal',
    label: 'Terminal',
    blurb: 'Browser terminal emulator that renders VT output and forwards raw input to your runtime.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/graph',
    label: 'Graph',
    blurb: 'Interactive node canvas over a vendored xyflow engine, plus network and timeline projections of the same document.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'projections', label: 'Projections' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/socket',
    label: 'Socket',
    blurb: 'Types-only contracts for graph and workbench socket wiring.',
    sections: USAGE_AND_API,
  },
  {
    path: 'components/collab',
    label: 'Collab',
    blurb: 'CRDT text sync over a vendored Yjs, with presence awareness and a pluggable transport.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/form',
    label: 'Form',
    blurb: 'Schema-driven layouts, labelled inputs, and a Promise-based submit contract.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'schema', label: 'Schema' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/character-card',
    label: 'Character Card',
    blurb: 'SillyTavern-shaped Character Card V2 editor composed on FormLayout, with JSON and PNG round-trips.',
    sections: [
      { id: 'editor', label: 'Editor' },
      { id: 'schema', label: 'Schema' },
      { id: 'usage', label: 'Usage' },
      { id: 'api', label: 'API' },
    ],
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
    path: 'components/video-player',
    label: 'Video Player',
    blurb: 'The immersive video surface behind MediaPlayer kind="video", with speed, fullscreen, and auto-hiding chrome.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/media',
    label: 'Media Primitives',
    blurb: 'Slider, VolumeControl, Waveform, and the artwork placeholder every media surface is built from.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/code',
    label: 'Code',
    blurb: 'Syntax-highlighted code and tabbed examples, sharing one lowlight instance with the editor and chat.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/panel',
    label: 'Panel',
    blurb: 'The controlled disclosure shell the Editor and Terminal are mounted inside.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/button',
    label: 'Button',
    blurb: 'The shared button surface, as a component and as a bare class anchors can wear.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'anchors', label: 'On anchors and other elements' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'components/settings-popout',
    label: 'Settings Popout',
    blurb: 'A searchable, keyboard-driven picker for player settings and other grouped choices.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/dice',
    label: 'Dice',
    blurb: 'A controlled dice roller, and the worked example of extending Icon past lucide’s catalog.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
  {
    path: 'components/icon',
    label: 'Icons',
    blurb: 'One seam over lucide-react, with a fixed size scale and a status glyph registry.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
      { id: 'sizes', label: 'Sizes' },
      { id: 'status', label: 'Status' },
      { id: 'vocabulary', label: 'Vocabulary' },
      { id: 'extending', label: 'Extending' },
      { id: 'api', label: 'API' },
    ],
  },
  {
    path: 'graph',
    label: 'Dependency Graph',
    blurb: 'Every tint component and what it builds on — derived from the real import graph.',
    sections: [
      { id: 'preview', label: 'Preview' },
      { id: 'usage', label: 'Usage' },
    ],
  },
  {
    path: 'components/theme',
    label: 'Theme',
    blurb: 'Two independent axes — light/dark scheme and palette family — driven by data attributes.',
    sections: [
      { id: 'preview', label: 'Preview' },
      ...USAGE_AND_API,
    ],
  },
] as const satisfies readonly DocRouteShape[]

/** Literal union of valid paths, so a typo in `<DocsNav current>` is a type error. */
export type DocRoutePath = (typeof ROUTE_DATA)[number]['path']

/**
 * Docs pages that cover several component directories at once.
 *
 * Most routes are `components/<directory>` one-for-one, and two guards lean on
 * that: `exports.test.ts` wants a route per package subpath, and
 * `componentGraph.test.ts` wants a graph node per route. A grouped page — six
 * small overlay primitives documented together rather than as six near-empty
 * pages — satisfies neither by name, so the membership is declared here instead
 * of each guard growing its own private exception list.
 */
export const GROUPED_ROUTE_MEMBERS = {
  'components/chrome': ['badge', 'context-menu', 'dialog', 'progress', 'toast', 'tree'],
} satisfies Partial<Record<DocRoutePath, string[]>>

/**
 * Sidebar groups, in display order. Kept as a separate satisfies-record rather
 * than a field on each entry so adding a route without a group (or vice versa)
 * is a compile error, the same trick `pages.tsx` uses for page components.
 */
export const DOC_GROUPS = ['Media', 'Chat & content', 'Data & infra', 'Theming & layout', 'Meta'] as const
export type DocGroup = (typeof DOC_GROUPS)[number]

export const ROUTE_GROUPS = {
  'components/media-player': 'Media',
  'components/video-player': 'Media',
  'components/media': 'Media',
  'components/audio-input': 'Media',
  'components/settings-popout': 'Media',
  'components/chat': 'Chat & content',
  'components/editor': 'Chat & content',
  'components/code': 'Chat & content',
  'components/terminal': 'Chat & content',
  'components/table': 'Data & infra',
  'components/chrome': 'Data & infra',
  'components/graph': 'Data & infra',
  'components/socket': 'Data & infra',
  'components/collab': 'Data & infra',
  'components/auth': 'Data & infra',
  'components/theme': 'Theming & layout',
  'components/panel': 'Theming & layout',
  'components/button': 'Theming & layout',
  'components/icon': 'Theming & layout',
  'components/dice': 'Theming & layout',
  'components/form': 'Theming & layout',
  'components/character-card': 'Data & infra',
  'graph': 'Meta',
} satisfies Record<DocRoutePath, DocGroup>

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
  // Real paths win over aliases, in both passes rather than one combined test:
  // a retired alias that later becomes a live page would otherwise shadow it,
  // depending only on which entry happened to come first in the list.
  return (
    DOC_ROUTES.find((route) => route.path === path) ??
    DOC_ROUTES.find((route) => route.aliases?.some((alias) => alias === path))
  )
}

export function hrefFor(route: DocRoute): string {
  return `#/${route.path}`
}
