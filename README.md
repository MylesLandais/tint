# tint

Tint is a React component library for media and rich chat interfaces. It includes
**VideoPlayer**, **SettingsPopout**, and a controlled **Chat** component family.

The documentation site contains an interactive, client-only Chat demo plus the source-backed
research that informed its controlled React architecture, accessibility contract, and exported
TypeScript API.

## Quick start

```bash
npm install
npm run dev
```

Open the docs site to preview the components and copy usage examples.

Open `#/components/chat` for the mock chat demo or `#/chat/patterns` for the supporting
research.

Demo video: [Big Buck Bunny](https://test-videos.co.uk/bigbuckbunny/mp4-h264) (MP4 H.264) stored at `public/videos/big-buck-bunny.mp4`.

## Using the component

```tsx
import { VideoPlayer } from 'tint'

export function Example() {
  return <VideoPlayer src="/videos/big-buck-bunny.mp4" />
}
```

Chat components can be imported from the package root or the focused subpath:

```tsx
import { ChatComposer, ChatConversation, ChatMessageList } from 'tint/chat'
```

`DataTable` is controlled the same way. Its pipeline — filter, then sort, then
paginate — is a pure function you can also run on the server:

```tsx
import { DataTable, deriveRows, type TableColumn } from 'tint/table'

const rows = deriveRows(tracks, { columns, sort, filters, page })
```

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

A theme declares all 31 tokens under its own selector. Every token is required — components
reference them with no fallback, so an omitted token renders an invisible element rather than
silently reverting to a light default. `src/styles/themes.test.ts` enforces this across all
shipped themes.

```css
[data-theme='nord'] {
  --tint-ink: light-dark(#2e3440, #eceff4);
  --tint-panel: light-dark(#ffffff, #3b4252);
  /* …the remaining 29… */
}
```

| Group | Tokens |
| --- | --- |
| Surface & text | `bg` `surface` `panel` `ink` `muted` `border` `border-strong` |
| Accent | `accent` `accent-hover` `accent-soft` `on-accent` |
| Status | `danger` `warning` `success` `info`, each × `{base}` `-soft` `-ink` |
| Code | `code` `code-ink` `code-muted` `code-border` |
| Media chrome | `chrome` `chrome-ink` `chrome-border` |
| Elevation | `shadow-color` |

`-soft` is the background wash and `-ink` is text that must stay readable on it. Media chrome
overlays video, so it is tinted per theme but deliberately does **not** use `light-dark()` —
light controls over bright footage are unreadable.

See `src/styles/contract.css` for the annotated reference.

## Project layout

```
src/
  components/video-player/     # reusable VideoPlayer
  components/settings-popout/  # searchable settings popout
  components/chat/             # controlled chat primitives and rich parts
  components/table/            # controlled DataTable and its pure behavior core
  components/theme/            # scheme/theme hooks and controlled toggles
  styles/contract.css          # the annotated token contract
  styles/themes/               # tint, solarized, gruvbox
  docs/                        # component docs and rendered chat research
  index.ts                     # library exports
docs/chat/                     # canonical chat research Markdown
public/videos/                 # demo media assets
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start the docs site      |
| `npm run build` | Typecheck and build docs |
| `npm run lint`  | Lint the project         |
| `npm test`      | Run the test suite       |
