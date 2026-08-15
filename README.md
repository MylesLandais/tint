# tint

Tint is a React component library for media, rich chat, drafting, and interactive
workbench interfaces. It includes **MediaPlayer** (one entry point for audio and video),
controlled **AudioInput** and **Chat** components, a WYSIWYG **Editor**, and a
runtime-agnostic **TerminalConsole**.

The documentation site contains an interactive, client-only Chat demo alongside prop tables for
each component. The research that informed Chat's controlled architecture, accessibility
contract, and exported TypeScript API lives in the author's personal notes rather than this
repo.

## Installation

```bash
npm install tint
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
import 'tint/styles.css'
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

Open `http://tint.localhost/` for the component index — every documented component
is linked from there, including `#/components/editor` (the rich-text buffer),
`#/components/terminal` (the mock PTY-backed terminal), `#/components/auth`,
`#/components/form` (schema-driven layouts), `#/components/character-card`,
`#/components/chat`, `#/components/media-player`, `#/components/video-player`,
`#/components/media` (the primitives the players are built from),
`#/components/code`, `#/components/panel`, `#/components/settings-popout`,
`#/components/dice`, `#/components/graph`, and `#/components/audio-input`.

Doc pages are declared once in `src/docs/routes.ts`; the router, the page title, the
breadcrumb, and the index cards all read from that list, so a new entry appears
everywhere at once.

Demo video: [Big Buck Bunny](https://test-videos.co.uk/bigbuckbunny/mp4-h264) (MP4 H.264) stored at `public/videos/big-buck-bunny.mp4`.

## Using the component

```tsx
import { MediaPlayer } from 'tint'

export function Example() {
  return <MediaPlayer kind="video" src="/videos/big-buck-bunny.mp4" label="Big Buck Bunny" />
}
```

Chat components can be imported from the package root or the focused subpath:

```tsx
import { ChatComposer, ChatConversation, ChatMessageList } from 'tint/chat'
```

Audio playback and microphone capture are separate focused packages. `AudioInput` captures
the stream and forwards it to a host-supplied `AudioTranscriber`; it does not choose a speech
service or send audio anywhere by itself:

```tsx
import { AudioInput, type AudioTranscriber } from 'tint/audio-input'
import { MediaPlayer } from 'tint/media-player'

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
import { Editor, type EditorDocument } from 'tint/editor'

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
import { TerminalConsole, type TerminalSession } from 'tint/terminal'

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
} from 'tint/table'

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
import { createCollabSession } from 'tint/collab'

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
import { InteractiveGraphView, applyCommand } from 'tint/graph'
import 'tint/graph/styles.css'

const [document, setDocument] = useState(initialGraph)

<InteractiveGraphView document={document} onDocumentChange={setDocument} />
```

`applyCommand(document, command, registry)` is the reducer behind
`onDocumentChange`. Hosts running their own store can ignore that callback and
reduce `onCommand` themselves with the same function.

The graph carries its own stylesheet — `tint/graph/styles.css`, alongside
`tint/styles.css` — because it brings xyflow's CSS with it and non-graph
consumers should not pay for that. ComfyUI workflow support is composed in via
`comfyNodeDefinition`; the default registry is domain-neutral.

A node kind may declare `formSchema`. The inspector then renders `FormLayout`
and Apply submits `node.configure` through the same reducer. Inspector forms
need `tint/form/styles.css` as well.

`FormLayout` is schema-driven: the host owns `values`, Tint maps `FormSchema`
onto labelled inputs and a `FormSubmitEnvelope`. Hosts persist through
`FormTransport` (the same injectable-Promise shape as `AuthTransport`).
`SignInForm` and `CharacterCardEditorForm` are composed on this kit.

```tsx
import { FormLayout, DEMO_FORM_SCHEMA, defaultValuesForSchema } from 'tint/form'
import 'tint/form/styles.css'

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
import 'tint/styles.css'                   // contract + the default palette
import 'tint/themes/solarized.css'         // optional
import 'tint/themes/gruvbox.css'           // optional
```

### Two independent axes

| Attribute on `<html>` | Absent means | Set it to |
| --- | --- | --- |
| `data-scheme` | follow the operating system | `"light"` or `"dark"` to force |
| `data-theme` | the built-in `tint` palette | `"solarized"`, `"gruvbox"`, or your own |

Light and dark resolve through CSS `light-dark()` against `:root { color-scheme: light dark }`.
There is no media query in any theme file and no duplicated dark block — forcing a scheme sets
`color-scheme` to a single value, which flips every token at once. Because the attributes are
plain CSS selectors, they also work on a subtree: a `<div data-theme="gruvbox">` themes only
what it contains.

### Toggles

The state is a hook and the controls are controlled components, so an app with its own
preference store can supply its own values:

```tsx
import { ThemeToggle, useColorScheme } from 'tint/theme'

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
import { Icon, StatusIcon, Spinner } from 'tint/icon'
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
  components/media/            # shared scrubber, volume control, waveform, placeholder, and time formatting
  components/audio-input/      # controlled microphone/transcriber seam
  components/settings-popout/  # searchable settings popout
  components/chat/             # controlled chat primitives and rich parts
  components/code/             # highlighted code blocks and tabbed examples
  components/table/            # controlled DataTable and its pure behavior core
  vendor/tanstack-table-core/  # vendored TanStack table engine
  components/collab/           # Yjs CollabConfig + createCollabSession
  vendor/yjs/                  # vendored Yjs v13 CRDT engine
  components/graph/            # controlled node canvas — contracts, adapter, node views
  vendor/xyflow/               # vendored xyflow graph engine
  components/form/             # FormLayout, form_inputs, and the submit Promise contract
  components/character-card/   # Tavern Card V2 editor composed on FormLayout
  components/theme/            # scheme/theme hooks and controlled toggles
  components/icon/             # Icon / StatusIcon, the size scale, the status registry
  components/dice/             # DiceRoller — a worked example of extending Icon
  components/panel/            # controlled disclosure shell shared by workbench surfaces
  components/editor/           # controlled Tiptap rich-text editor
  components/terminal/         # xterm emulator with a consumer-owned runtime adapter
  components/auth/             # controlled sign-in form and OAuth links
  auth/client/                 # transport-agnostic session client
  lib/                         # internal cross-component helpers — not a public subpath
  styles/contract.css          # the annotated token contract
  styles/themes/               # tint, solarized, gruvbox
  docs/                        # component docs and demos
  docs/routes.ts               # the docs route registry — add a page here first
  index.ts                     # library exports
public/videos/                 # demo media assets
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start the docs site      |
| `npm run build` | Typecheck and build docs |
| `npm run lint`  | Lint the project         |
| `npm test`      | Run the test suite       |
