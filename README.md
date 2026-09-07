# tint

Tint is a React component library for media, rich chat, drafting, and interactive
workbench interfaces. Every component is **controlled**: it renders what you pass and
reports intent back through callbacks. None of them fetch, persist, or own a store.

Broadly it covers:

- **Media** — `MediaPlayer` (one entry point for audio and video), `VideoPlayer`, the
  scrubber/volume/waveform primitives underneath them, and `AudioInput`.
- **Chat and content** — controlled `Chat` primitives, a WYSIWYG `Editor` on Tiptap, a
  runtime-agnostic `TerminalConsole` on xterm, highlighted code blocks, and the
  `Feed` / `Activity` reading surfaces.
- **Data and infra** — `DataTable`, `InteractiveGraphView`, `Board`, `Calendar` (with an
  iCalendar parser and a CalDAV client), telemetry views, `Policy` rule editing, `Notify`,
  collaboration sessions on Yjs, and auth forms.
- **Theming and layout** — the `--tint-*` token contract, seven themes, `Panel`,
  `Button`, and the icon scale.

The documentation site is the reference: every component has a live demo and a prop
table, and the prop tables are guarded by a test that fails when a component grows a
prop nobody documented.

## Installation

Tint is private and published as `@nebula/tint` to the nebula organization's Forgejo
package registry, not to npmjs.com. Point the `@nebula` scope at that registry — and
only that scope, so everything else still resolves publicly — in your app's `.npmrc`:

```
@nebula:registry=https://git.nebula-1.com/api/packages/nebula/npm/
//git.nebula-1.com/api/packages/nebula/npm/:_authToken=${NODE_AUTH_TOKEN}
```

The token is a Forgejo access token with the `read:package` scope, exported as
`NODE_AUTH_TOKEN` rather than written into the file. Then:

```bash
npm install @nebula/tint
```

Tint ships **raw TypeScript source** rather than a compiled bundle — every export
points at a `.ts`/`.tsx` file under `src/`. Three consequences worth knowing before
you start:

| Requirement | Why |
| --- | --- |
| React ≥ 19 | Peer dependency. Components use the React 19 ref-as-prop form. |
| Tailwind CSS v4 | Components are styled with Tailwind utilities, not shipped CSS. |
| A bundler that transpiles the package | There is no prebuilt JS. Frameworks that pre-bundle `node_modules` (Next.js, for one) need tint added to their transpile list. |

Import the stylesheet once, at your app's entry. It is **required**, not optional —
every surface reads a `--tint-*` custom property and there is nothing to render
against without it:

```tsx
import '@nebula/tint/styles.css'
```

That single import carries the token contract, the default palette, and — via a
`@source` directive inside it — instructions for your Tailwind build to scan
tint's own components. That last part matters: Tailwind v4 excludes `node_modules`
from automatic content detection, so without it you would get the tokens and none
of the utility classes the components use, and everything would render nearly
unstyled. Tint declares this for you; you do not need an `@source` line of your own.

## Quick start (this repo)

```bash
npm install
npm run dev
```

The dev server owns `127.0.0.1:45173` and refuses to auto-select another port.
Local Traefik exposes it at the repo-specific origin `http://tint.localhost`.
`http://127.0.0.1:45173` is the direct-upstream diagnostic URL, not the normal
browser entrypoint.

Open `http://tint.localhost/` for the component index. Rather than listing the routes
here — where they go stale — see `src/docs/routes.ts`, which is the single registry the
router, page titles, breadcrumbs, sidebar groups, index cards, and the `⌘K` / `Ctrl-K` search
palette all read from. Adding an entry there makes a page appear in every one of them at
once, and the type system will not let you add a route without also adding its page
component, its sidebar group, and its import snippet.

`#/graph` renders the dependency graph between component packages. It is generated data,
not a runtime scan — regenerate it with `python3 scripts/gen-docs-graph.py` after adding
a component or changing what one imports.

Demo video: [Big Buck Bunny](https://test-videos.co.uk/bigbuckbunny/mp4-h264) (MP4 H.264) stored at `public/videos/big-buck-bunny.mp4`.

## PokéForce map client

The Tile Map page uses the independent reconstruction source in
`~/Downloads/pokeforce-source.zip` and the locally installed PFCK cache. The
checked-in browser pack contains only the selected Johto spawn region and the
New Bark laboratory; the source and private cache remain external.

Regenerate it after obtaining a new source/cache pair:

```bash
uv run --with xxhash --with zstandard --with msgpack \
  python scripts/generate-pokeforce-map-pack.py
```

The exporter records both input hashes in `public/pokeforce/map.json`. The docs
demo falls back to its deterministic mock if the pack is unavailable, and uses
the decoded pack when served locally.

## Working with the gateway checkout

There are two ways to consume Tint, and which one you want depends on how close your
work is to the library. Apps that merely *use* Tint install the published package (see
[Installation](#installation)) and move by version. The `Workspace-end` application
gateway does not: library work and gateway work land on the same day, so it consumes
Tint as a git submodule at
`third_party/tint`, registered as an npm workspace and pinned to a commit. That means
there are normally **two checkouts of this repo on a workstation**: this one, where
library work happens, and the gateway's, which is a pinned copy the web clients build
against.

The pin is what keeps them honest, so changes flow one way:

1. Make the change here, on a branch, and land it on `main`.
2. In the gateway, move the submodule to that commit and commit the new gitlink.
3. Run `npm run check` from the gateway root. It runs `check:tint` first — Tint's own
   `src/consumer-contract.test.ts` — so an upstream break is reported before any app
   check muddies it.

Editing inside `third_party/tint` works, since it is a real clone, but anything left
uncommitted there is invisible to this checkout and easy to lose to a later
`git submodule update`. If you find changes there, commit them on a branch and push
before touching the pin.

### Cutting a release

Everyone else moves by published version. Bump `version` in `package.json` on `dev`,
commit, and push a matching `v<version>` tag to Forgejo. `.forgejo/workflows/release.yml`
runs lint, build and test, then publishes to the registry with the `FORGEJO_NPM_TOKEN`
repository secret. If no Actions runner is registered on the instance, publish by hand
with `NODE_AUTH_TOKEN=<forgejo-token> npm publish` — `publishConfig` in `package.json`
pins the registry, so this cannot reach npmjs.com by accident.

Two things bite consumers, both because Tint ships TypeScript source rather than a build:

- A consumer's `tsc` compiles our files inside *their* program, under *their*
  `tsconfig.json` — a different program from the one `npm run build` checks here.
  `src/consumer-contract.test.ts` exists to catch that gap; run it before bumping the pin.
- React and `@types/react` must resolve to exactly one copy, or component props produce a
  wall of "not assignable" errors between two nominally distinct copies of identical types.

The gateway side of this — cloning with submodules, the React pinning rules, and how to
diagnose both — is documented in that repo at `docs/operations/local-environment.md`.

## Using the component

```tsx
import { MediaPlayer } from '@nebula/tint'

export function Example() {
  return <MediaPlayer kind="video" src="/videos/big-buck-bunny.mp4" label="Big Buck Bunny" />
}
```

Chat components can be imported from the package root or the focused subpath:

```tsx
import { ChatComposer, ChatConversation, ChatMessageList } from '@nebula/tint/chat'
```

Agent traces are host-owned spans. Tint lays them out as a waterfall Gantt, RED metrics, and a
service map drawn with `@nebula/tint/graph` — it does not collect, export, or ship a tracing backend:

```tsx
import { TraceViewer, TraceServiceMap } from '@nebula/tint/telemetry'
import '@nebula/tint/graph/styles.css'
```

Subscriptions, policy rules, notifications, and Digg-style activity are separate
focused packages. The host owns the documents; Tint presents them. A **Channel**
is a routeable room/topic (`channel/misskatie`); a **Source** is one inbound
platform stream into that room. Fixtures are mock-only — no live crawl. Lua is
edited and highlighted in the policy editor — it is never executed in the browser:

```tsx
import {
  FeedLayout,
  SplitPane,
  ReaderPane,
  channelPath,
  resolveAttribution,
} from '@nebula/tint/feed'
import { NotificationBell, deriveFeedNotifications, NotificationSettingsPanel } from '@nebula/tint/notify'
import { PolicyTable, PolicyEditor, applyPolicyCommand } from '@nebula/tint/policy'
import { ActivityFeed, sortActivityEvents } from '@nebula/tint/activity'
```

## Application client

Tint 0.2 provides one optional application boundary for transport-backed state. The application constructs the adapters; Tint coordinates lifecycle and exposes capability-specific hooks. Visual components remain controlled and work without the provider.

```tsx
import { createBrowserPlaybackAdapter, createTintClient, TintClientProvider } from '@nebula/tint/client'
import { createAuthClient } from '@nebula/tint/auth'

const client = createTintClient({
  request,
  auth: createAuthClient({ transport: authTransport }),
  navigation,
  realtime,
  uploads,
  storage,
  playback: createBrowserPlaybackAdapter(),
})

root.render(
  <TintClientProvider client={client}>
    <App />
  </TintClientProvider>,
)
```

The 0.1 migration map is in [`docs/migrations/0.2.md`](docs/migrations/0.2.md).

`createBrowserPlaybackAdapter()` keeps metadata for the current playback queue in
`localStorage` and synchronizes it across tabs. It deliberately excludes media source URLs, so
signed streams and credentials never enter the persisted queue record.

Audio playback and microphone capture are separate focused packages. `AudioInput` captures
the stream and forwards it to a host-supplied `AudioTranscriber`; it does not choose a speech
service or send audio anywhere by itself:

```tsx
import { AudioInput, type AudioTranscriber } from '@nebula/tint/audio-input'
import { MediaPlayer } from '@nebula/tint/media-player'

<AudioInput
  transcriber={transcriber satisfies AudioTranscriber}
  value={draft}
  onValueChange={setDraft}
  onCapture={(blob, meta) => saveVoiceNote(blob, meta.duration)}
/>
<MediaPlayer
  kind="audio"
  src="/recordings/briefing.webm"
  label="Project briefing"
  title="Project briefing"
  artist="Operations"
  onPrevious={() => queue.previous()}
  onNext={() => queue.next()}
/>
```

`MediaPlayer` scales to the width of its containing slot: wide rails render the full hero
layout with queue and volume controls, while narrow chat slots reduce to artwork, playback,
metadata, and seek. An explicit `size` prop overrides the auto-detected tier. The optional
offset shadow is enabled with `shadow`; it is disabled by default for embedded rows.

The Web Speech adapter on the docs page is only a demo. Browser support is limited and a
browser’s default recognition service may process captured audio remotely.

## Editor and terminal

`Editor` uses a controlled Tiptap JSON document. Its disclosure state is controlled too,
so an application can coordinate it with the rest of a workbench without Tint choosing a
store:

```tsx
import { Editor, type EditorDocument } from '@nebula/tint/editor'

const [document, setDocument] = useState<EditorDocument>({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})
const [editorOpen, setEditorOpen] = useState(true)

<Editor
  value={document}
  onValueChange={setDocument}
  expanded={editorOpen}
  onExpandedChange={setEditorOpen}
/>
```

`TerminalConsole` is a full VT/ANSI emulator, not a shell. Connect its session adapter to
your PTY, WebSocket, worker, or browser runtime; Tint only forwards raw input and renders
streamed output:

```tsx
import { TerminalConsole, type TerminalSession } from '@nebula/tint/terminal'

const session: TerminalSession = {
  onOutput(listener) {
    runtime.on('data', listener)
    return () => runtime.off('data', listener)
  },
  sendInput: data => runtime.write(data),
  resize: size => runtime.resize(size.cols, size.rows),
}

<TerminalConsole
  session={session}
  status="connected"
  expanded={terminalOpen}
  onExpandedChange={setTerminalOpen}
/>
```

`DataTable` is controlled the same way. Its pipeline — filter, then sort, then
paginate — is a pure function you can also run on the server.

Prefer the typed client models for UI state (MUI-shaped filter items, TanStack-shaped
sorting), then adapt into `deriveRows` or `useDataTable`:

```tsx
import {
  DataFilterControls,
  DataTable,
  deriveRows,
  toDeriveFilters,
  toTableSort,
  type DataFilterModel,
  type DataSortingState,
  type TableColumn,
} from '@nebula/tint/table'

const [filterModel, setFilterModel] = useState<DataFilterModel>({ items: [] })
const [sorting, setSorting] = useState<DataSortingState>([])

const rows = deriveRows(tracks, {
  columns,
  filters: toDeriveFilters(filterModel),
  sort: toTableSort(sorting),
  page,
})
```

`toColumnFilters(filterModel)` is the same bridge for the TanStack engine path.

Collaborative text is a typed config, not an editor. Hosts own the room name and
provider mesh; tint vendored Yjs v13 and exposes `createCollabSession`:

```tsx
import { createCollabSession } from '@nebula/tint/collab'

const session = createCollabSession({
  room: 'workspace:crate:note:intro',
  network: { kind: 'broadcast' }, // or { kind: 'none' } / injected websocket
})

session.fragment.insert(0, 'hello')
session.awareness?.setLocal({ name: 'warby' })
session.destroy()
```

Websocket needs an injected `createProvider` — tint does not depend on `y-websocket`.
Do not point hosts at the public Yjs demo server. TipTap / `y-prosemirror` binding is
a later editor adapter, not this package.

`InteractiveGraphView` is a node canvas over a vendored xyflow. It holds no
document state: it reports what the user did and hands back the document that
results, so edits only stick if you pass the new document back.

```tsx
import { InteractiveGraphView, applyCommand } from '@nebula/tint/graph'
import '@nebula/tint/graph/styles.css'

const [document, setDocument] = useState(initialGraph)

<InteractiveGraphView document={document} onDocumentChange={setDocument} />
```

`applyCommand(document, command, registry)` is the reducer behind
`onDocumentChange`. Hosts running their own store can ignore that callback and
reduce `onCommand` themselves with the same function.

The graph carries its own stylesheet — `@nebula/tint/graph/styles.css`, alongside
`@nebula/tint/styles.css` — because it brings xyflow's CSS with it and non-graph
consumers should not pay for that. ComfyUI workflow support is composed in via
`comfyNodeDefinition`; the default registry is domain-neutral.

A node kind may declare `formSchema`. The inspector then renders `FormLayout`
and Apply submits `node.configure` through the same reducer. Inspector forms
need `@nebula/tint/form/styles.css` as well.

`FormLayout` is schema-driven: the host owns `values`, Tint maps `FormSchema`
onto labelled inputs and a `FormSubmitEnvelope`. Hosts persist through
`FormTransport` (the same injectable-Promise shape as `AuthTransport`).
`SignInForm` and `CharacterCardEditorForm` are composed on this kit.

```tsx
import { FormLayout, DEMO_FORM_SCHEMA, defaultValuesForSchema } from '@nebula/tint/form'
import '@nebula/tint/form/styles.css'

const [values, setValues] = useState(() => defaultValuesForSchema(DEMO_FORM_SCHEMA))

<FormLayout schema={DEMO_FORM_SCHEMA} values={values} onValuesChange={setValues} />
```

Open `#/components/form` to edit a schema and watch the layout update, and
`#/components/character-card` for the SillyTavern-shaped V2 editor.

Open `#/components/collab` for two textareas sharing one room.

## Theming

Components carry no hardcoded colors. Every surface reads a `--tint-*` custom property,
so **the stylesheet is required** — without it there is nothing to render against:

```tsx
import '@nebula/tint/styles.css'                   // contract + the default palette
import '@nebula/tint/themes/solarized.css'         // optional
import '@nebula/tint/themes/gruvbox.css'           // optional
import '@nebula/tint/themes/mocha.css'             // optional — Catppuccin, one file per flavor
```

The Catppuccin flavors ship as `latte.css`, `frappe.css`, `macchiato.css`, and `mocha.css`.

### Two independent axes

| Attribute on `<html>` | Absent means | Set it to |
| --- | --- | --- |
| `data-scheme` | follow the operating system | `"light"` or `"dark"` to force |
| `data-theme` | the built-in `tint` palette | `"solarized"`, `"gruvbox"`, `"latte"`, `"frappe"`, `"macchiato"`, `"mocha"`, or your own |

Light and dark resolve through CSS `light-dark()` against `:root { color-scheme: light dark }`.
There is no media query in any theme file and no duplicated dark block — forcing a scheme sets
`color-scheme` to a single value, which flips every token at once. Because the attributes are
plain CSS selectors, they also work on a subtree: a `<div data-theme="gruvbox">` themes only
what it contains.

**The four Catppuccin flavors are the exception.** A flavor is already a complete palette, so each
file commits to one instead of pairing two through `light-dark()`: `data-theme="mocha"` is Mocha
whatever the reader's scheme is. Each declares its own `color-scheme` so native controls match, but
from a bare `[data-theme]` selector — an explicit `data-scheme` still wins, moving the native chrome
without flipping the palette. Offer `latte` where you would offer a light theme and one of the other
three where you would offer a dark one.

### Toggles

The state is a hook and the controls are controlled components, so an app with its own
preference store can supply its own values:

```tsx
import { ThemeToggle, useColorScheme } from '@nebula/tint/theme'

function Appearance() {
  const { preference, setPreference } = useColorScheme()
  return <ThemeToggle value={preference} onChange={setPreference} />
}
```

`useColorScheme` returns `preference` (the stored `system | light | dark` choice), `resolved`
(what the system actually landed on), and `setPreference`. `useThemeName` is the same shape for
the palette axis.

### Preventing the flash

A stored preference is applied by React only after hydration, so add this to your HTML `<head>`,
before any stylesheet or module. It is what keeps a dark-mode reader from seeing a white frame:

```html
<script>
  (function () {
    try {
      var root = document.documentElement
      var scheme = localStorage.getItem('tint-color-scheme')
      if (scheme === 'light' || scheme === 'dark') root.dataset.scheme = scheme
      var theme = localStorage.getItem('tint-theme')
      if (theme && theme !== 'tint') root.dataset.theme = theme
    } catch (error) {}
  })()
</script>
```

### Writing a theme

A theme declares all 37 tokens under its own selector. Every token is required — components
reference them with no fallback, so an omitted token renders an invisible element rather than
silently reverting to a light default. `src/styles/themes.test.ts` enforces this across all
shipped themes.

```css
[data-theme='nord'] {
  --tint-ink: light-dark(#2e3440, #eceff4);
  --tint-panel: light-dark(#ffffff, #3b4252);
  /* …the remaining 35… */
}
```

| Group | Tokens |
| --- | --- |
| Surface & text | `bg` `surface` `panel` `ink` `muted` `border` `border-strong` |
| Accent | `accent` `accent-hover` `accent-soft` `on-accent` |
| Status | `danger` `warning` `success` `info`, each × `{base}` `-soft` `-ink` |
| Code | `code` `code-ink` `code-muted` `code-border` plus `code-keyword` `code-string` `code-number` `code-comment` `code-function` `code-punctuation` |
| Media chrome | `chrome` `chrome-ink` `chrome-border` |
| Elevation | `shadow-color` |

`-soft` is the background wash and `-ink` is text that must stay readable on it. Media chrome
overlays video, so it is tinted per theme but deliberately does **not** use `light-dark()` —
light controls over bright footage are unreadable.

See `src/styles/contract.css` for the annotated reference.

## Icons

Every icon in tint renders through one seam — `Icon`, a thin wrapper around
[`lucide-react`](https://lucide.dev) (the library's sole icon dependency) with a fixed size
scale and a decorative-by-default accessibility posture. `StatusIcon` layers a shared
loading/success/error/… registry on top, so a status indicator is defined once and reused
across chat, table, and media-player instead of reimplemented per feature.

```tsx
import { Icon, StatusIcon, Spinner } from '@nebula/tint/icon'
import { Search } from 'lucide-react'

<Icon icon={Search} size="sm" />
<StatusIcon status="success" />
<Spinner size="sm" />              {/* StatusIcon pinned to status="loading" */}
```

| Size | Class      | Pixels |
| ---- | ---------- | ------ |
| `xs` | `size-3`   | 12px   |
| `sm` | `size-3.5` | 14px   |
| `md` | `size-4`   | 16px   |
| `lg` | `size-5`   | 20px   |
| `xl` | `size-6`   | 24px   |

`Spinner` deliberately does not carry the registry's info-blue tone — every existing loading
spinner in the library inherits its surrounding text color, and `Spinner` preserves that rather
than forcing a color call sites didn't ask for. `StatusIcon status="loading"` still carries the
tone, for the cases (like a multi-state status pill) where a fixed color is the point.

See the **Icons** page in the docs site (`#/components/icon`) for the full size scale, status
registry, and icon vocabulary the library actually uses.

**If you copied one of tint's components into your app** (this README says you can): earlier
versions rendered lucide icons directly — `<Sun className="size-3.5" aria-hidden="true" />`,
each call site re-specifying its own size and `aria-hidden`. That still works, since
`lucide-react` remains a plain dependency, but it's no longer how tint's own components do it.
Swap to `<Icon icon={Sun} size="sm" />` to stay aligned with the rest of the library.

## Project layout

```
src/
  components/media-player/     # unified audio/video MediaPlayer
  components/video-player/     # the immersive video surface MediaPlayer kind="video" delegates to
  components/media/            # shared scrubber, volume control, waveform, placeholder, time formatting
  components/audio-input/      # controlled microphone/transcriber seam
  components/settings-popout/  # searchable settings popout
  components/chat/             # controlled chat primitives and rich parts
  components/code/             # highlighted code blocks and tabbed examples
  components/feed/             # reading surfaces: split pane, reader, highlights, narration
  components/activity/         # forum-shaped activity feed over threads and posts
  components/board/            # widget cards packed as masonry or kanban lanes
  components/calendar/         # month grid, iCalendar (RFC 5545) parsing, RRULE expansion
  calendar/client/             # CalDAV (RFC 4791) client — transport injected by the host
  components/policy/           # rule table, editor, and dry-run matching
  components/notify/           # notification bell, list, and quiet-hours settings
  components/table/            # controlled DataTable and its pure behavior core
  components/graph/            # controlled node canvas — contracts, adapter, node views
  components/telemetry/        # waterfall Gantt, RED metrics, graph service map for traces
  components/collab/           # Yjs CollabConfig + createCollabSession
  components/form/             # FormLayout, form inputs, and the submit Promise contract
  components/character-card/   # Tavern Card V2 editor composed on FormLayout
  components/auth/             # controlled sign-in form and OAuth links
  components/socket/           # transport-agnostic socket contracts
  components/editor/           # controlled Tiptap rich-text editor
  components/terminal/         # xterm emulator with a consumer-owned runtime adapter
  components/panel/            # controlled disclosure shell shared by workbench surfaces
  components/badge/ dialog/ context-menu/ progress/ toast/ tree/
                               # small overlay and feedback chrome, documented as one page
  components/button/           # the shared button surface, as a component and a bare class
  components/theme/            # scheme/theme hooks and controlled toggles
  components/icon/             # Icon / StatusIcon, the size scale, the status registry
  components/dice/             # DiceRoller — a worked example of extending Icon
  components/scrolling-label/  # single-line label that marquees only on overflow
  vendor/tanstack-table-core/  # vendored TanStack table engine
  vendor/yjs/                  # vendored Yjs v13 CRDT engine
  vendor/xyflow/               # vendored xyflow graph engine
  auth/client/                 # transport-agnostic session client
  lib/                         # internal cross-component helpers — not a public subpath
  styles/contract.css          # the annotated token contract
  styles/themes/               # tint, solarized, gruvbox, catppuccin ×4
  docs/                        # the docs site: one page per component
  docs/routes.ts               # the docs route registry — add a page here first
  docs/shell/                  # docs chrome: sidebar shell and the search palette
  docs/components/             # shared page furniture (DocsPage, PropsTable, CodeBlock)
  docs/fixtures/               # demo documents for the workbench pages; not published
  docs/generated/              # generated data — regenerate, never hand-edit
  index.ts                     # library exports
scripts/gen-docs-graph.py      # regenerates docs/generated/docsGraph.ts
public/videos/                 # demo media assets
```

Neither `src/docs` nor any test file is published — see `files` in `package.json`.

## Scripts

| Command                              | Description                                  |
| ------------------------------------ | -------------------------------------------- |
| `npm run dev`                        | Start the docs site                          |
| `npm run build`                      | Typecheck and build docs                     |
| `npm run lint`                       | Lint the project                             |
| `npm test`                           | Run the test suite                           |
| `python3 scripts/gen-docs-graph.py`  | Regenerate the component dependency graph    |

Several tests are guards rather than unit tests, and are worth knowing by name:
`consumer-contract.test.ts` typechecks every entry point the way a host does,
`propsTable.test.ts` fails when a component grows an undocumented prop,
`componentGraph.test.ts` fails when the generated graph drifts from the real imports,
and `routing.test.tsx` covers the route registry itself.

## Source and collaboration

See [tint Git history and collaboration](docs/git-history.md) for stable/dev branches, preserved history, cloning, and mirror recovery.
