# Tint

Tint is a Svelte 5 component library for media, chat, editing, data, and Workspace interfaces. Components render host-owned state and report user intent through props and callbacks. Framework-neutral models and engines live in plain TypeScript under `src/core`.

The [live docs](src/docs/svelte/routes.ts) cover component APIs and examples. The root package export and component subpaths expose Svelte components; `@nebula/tint/client` and `@nebula/tint/collab` expose plain TypeScript contracts and runtimes.

## Install

Tint is published privately as `@nebula/tint` in the nebula Forgejo registry. Configure only the `@nebula` scope in your app's `.npmrc`:

```ini
@nebula:registry=https://git.nebula-1.com/api/packages/nebula/npm/
//git.nebula-1.com/api/packages/nebula/npm/:_authToken=${NODE_AUTH_TOKEN}
```

Set `NODE_AUTH_TOKEN` to a Forgejo token with `read:package`, then install the package:

```bash
npm install @nebula/tint
```

Tint publishes TypeScript and Svelte source. Use Svelte 5, a bundler configured to compile `.svelte` files in dependencies, and Tailwind CSS v4. For Vite, use `@sveltejs/vite-plugin-svelte`. Import Tint's stylesheet once at your app entry; it provides semantic `--tint-*` tokens, component styles, and a Tailwind `@source` directive for Tint's own source.

```svelte
<script lang="ts">
  import { Button } from '@nebula/tint'
  import '@nebula/tint/styles.css'

  let count = $state(0)
</script>

<Button variant="primary" onclick={() => count += 1}>Clicked {count} times</Button>
```

Use Tint's public components in applications. Carbon Components Svelte is an internal Tint implementation dependency and is not part of Tint's public API.

For toolbar imports, use `UploadDropzone` from `@nebula/tint/media-assets` with
`compact`, a `label`, and `maxFiles={1}`. It composes Tint's native button with
the existing file classifier and returns original `File` objects. Repeated
choices reset the input; disabled or destroyed intake ignores late delivery.
Parsing, persistence, and operation ownership stay in the application. The
[Media Assets docs](src/docs/MediaAssetsDoc.svelte) show both presentations.

`WorkspaceTabs` keeps active and inactive border/text utility classes mutually
exclusive so the selected tab stays visible in consumer Tailwind builds. The
host still controls selection; the shared component owns keyboard focus and
keeps hidden panel contents mounted. See the [Shell API](src/docs/ShellDoc.svelte).

`CommandMenu` from `@nebula/tint/shell` renders the shared command listbox
used by `CommandPalette` and editor slash completion. Inline hosts can set
`preserveInputFocus`, `grouped={false}` and `icon={false}`; use
`commandOptionId` and `nextCommandIndex` for active-option identity and keyboard
navigation. Hosts retain draft, filtering policy, dismissal and execution.
`ChatComposer` accepts `inputExpanded` alongside its listbox and input-key hooks.
See the [Shell API](src/docs/ShellDoc.svelte).

`TextField` from `@nebula/tint/form` accepts optional native `minLength`,
`maxLength` and `list` attributes. Length constraints retain browser validation;
server validation and host values remain application-owned.
The host renders the datalist and retains free-form value ownership; suggestions
never impose a closed catalog or select a value automatically. See the
[Form Fields example](src/docs/form/FormFieldsDoc.svelte).

`ResizeHandle` and `WorkspaceSplit` from `@nebula/tint/shell` expose optional
`onResizingChange` for pointer capture lifetime. Start/end callbacks let hosts
coordinate their own drag appearance and persistence. Cancellation, disable,
axis/side change and destruction end capture once. Keyboard intent only emits
`onSizeChange`; saved values and application policy remain host-owned.

`FileField.onFileChange` supplies the original browser File (or null) separately
from serializable form metadata. The host owns encoding and upload. Repeated
choices clear native selection; disabled/destroyed intake ignores late events.
Only preview URLs created by the component are released by it.

`JsonView.previewLimit` bounds long evidence with existing Tint Button disclosure;
`previewExpanded` can be bound to host state. Truncated text remains clearly a
preview, and missing/invalid evidence remains distinct. See the
[Code examples](src/docs/CodeDoc.svelte).

`ChatReasoning` and built-in reasoning message parts accept opt-in `copyable`
and an optional `copyLabel`. The existing disclosure preserves the reader's
choice across streaming updates and renders plain text with whitespace intact.
Reasoning remains excluded from message-level copy. Shared message/code/reasoning copy
excludes duplicate pending writes, reports failures, and qualifies feedback by
source, message, part and mounted lifetime; a stale clipboard completion cannot
claim the new text was copied. Message copy emits its captured action only after
a current write succeeds. Idle copy feedback adds no status region; failures
expose their retryable message without replacing transcript announcements. See the [Chat example](src/docs/ChatDoc.svelte).

## Themes

The default stylesheet supplies the Tint palette and the token contract. To use another included palette, import its stylesheet after `styles.css` and set `data-theme` on a parent element:

```svelte
<script lang="ts">
  import '@nebula/tint/styles.css'
  import '@nebula/tint/themes/solarized.css'
</script>

<div data-theme="solarized">
  <!-- App content -->
</div>
```

Other palette subpaths are listed in [package.json](package.json). Light and dark colors follow the host's color scheme unless the host sets one explicitly. See [the token contract](src/styles/contract.css) for semantic color and spacing tokens.
The `carbon.css` palette provides Gray 10 / Gray 100 surfaces with Carbon blue
accents; import `@nebula/tint/themes/carbon.css` and set `data-theme="carbon"`.

## Develop

```bash
npm install
npm run dev
```

The docs site runs at `http://tint.localhost/` through the local Traefik route. Vite binds directly to `127.0.0.1:45173` and refuses a different port. The Svelte [route registry](src/docs/svelte/routes.ts) controls sidebar navigation, page search, and aliases for older bookmarks. `svelte-docs.html` redirects to `/` while preserving the hash. The Design Lab is at `/design-lab.html`.

After changing component imports, regenerate the docs dependency graph:

```bash
python3 scripts/gen-docs-graph.py
```

After adding or removing package source, refresh the checked migration inventory:

```bash
npm run migration:refresh
```

The inventory records source coverage; manual accessibility reviews are tracked in `migration/svelte-a11y-reviewed.txt`.

### Checks

| Command | Purpose |
| --- | --- |
| `npm run check` | React-free and Carbon boundaries, TypeScript, Svelte diagnostics, lint, unit tests |
| `npm run build` | TypeScript and Svelte checks, then production Vite build |
| `npm run test:e2e` | Build and run the Playwright browser suite against Vite preview |
| `npm run check:migration` | React-free source/dependencies, Carbon boundary, generated inventory |
| `npm run migration:refresh` | Regenerate the inventory after source changes |

The source portability and consumer contract tests check that published TypeScript entry points work outside Tint's own TypeScript program. `src/docs/componentGraph.test.ts` checks generated graph data, and `src/docs/svelte/routing.test.ts` checks docs routes and aliases.

## Sign-in and registration

`@nebula/tint` exports `AuthLayout` (`plain`, `card`, `split`), `LoginForm` (password or email-first), `RegistrationForm`, `OAuthButtons`, `AuthDivider` and `ProviderMark`. Discord, GitHub and Google get brand marks automatically. Provider sign-in goes through the same `AuthTransport`: the host lists providers in `getConfig`, builds the redirect in `oauthStartUrl`, and reports the provider as the session's first `authenticationMethods` entry after its callback. `AuthSnapshot.lastUsedMethod` drives the "Last used" badge; it is remembered on the device, and a server can override it with `AuthConfig.lastUsedMethod`. Tint ships no OAuth server. See `#/components/auth-forms` in the docs.

Roleplay editors (`GroupEditor`, `PersonaEditor`, `RegexRulesEditor`, `ImportReview`)
compose the same shared buttons and fields. Saved unknown enum values, regex
extensions, ordered members and empty optional depths remain host-owned data;
Tint does not execute regex rules or save profiles. See the
[roleplay forms examples](src/docs/form/RoleplayFormsDoc.svelte).

## Source layout

- `src/core/`: framework-neutral contracts, state machines, parsers, and engines (including `core/auth` provider registry, last-used memory and registration validation).
- `src/svelte/`: public Svelte components and bindings. `src/svelte/index.ts` is the root API.
- `src/docs/`: Svelte docs pages, fixtures, route registry, and generated graph data. Docs are not published.
- `src/styles/` and `src/index.css`: semantic tokens, palettes, and component styles.
- `src/vendor/`: vendored Yjs and TanStack table engine with provenance and boundary checks.
- `src/auth/client/` and `src/client/`: transport-neutral client contracts and adapters.
- `e2e/`: browser behavior checks.

## Workspace and releases

The Workspace gateway consumes Tint as a pinned git submodule at `third_party/tint`; published consumers move by package version. Make library changes in this checkout, land them on `dev`, then advance the gateway's submodule pin and run its `npm run check`. The consumer contract test here checks package entry points under a host TypeScript program before a pin or release moves.

To publish, update `version` in `package.json` on `dev`, commit, and push a matching `v<version>` tag to Forgejo. The [release workflow](.forgejo/workflows/release.yml) runs checks and publishes with `FORGEJO_NPM_TOKEN`. `publishConfig` fixes the target registry to Forgejo. More repository history and mirror details are in [docs/git-history.md](docs/git-history.md).

`WorkspaceTabs` accepts a shared `content: Snippet<[WorkspaceTab]>` renderer for
session lists built from data. A tab's own `content` snippet takes precedence.
The controlled `value` and `onChange` API still owns selection and keyboard navigation.

See [Workspace names and mixed-version compatibility](docs/migrations/workspace-names.md) for the current APIs, deprecated aliases and preview runtime configuration.

`SliderField` from `@nebula/tint/form` accepts optional `formatValue` for visible
output and accessible value text, such as percentages. Native bounds, step and
callback values stay numeric; omission preserves the existing presentation.
See the [form field examples](http://tint.localhost/#/components/form-fields).

`TextField` from `@nebula/tint/form` forwards optional `onkeydown` to the native
input. Hosts can prevent implicit Enter submission for an auxiliary form field
without global key listeners or private DOM selectors. Value changes remain controlled.

`Dialog` retains the original opener across a host-controlled modal replacement.
Nested dialogs return to their parent while it exists; closing the parent first
transfers the return target to the surviving child. Body scroll stays locked
until the last dialog closes. Late focus restoration cannot steal focus from a new modal.

`TextField` and `TextAreaField` from `@nebula/tint/form` accept optional native
`maxLength` bounds. The browser enforces user input limits; Tint preserves host
values unchanged. See `#/components/form-fields` for the bounded search example.

Route navigation reuses `NavigationList orientation="horizontal"` with wrapped native links. Graph runtime summaries distinguish `unknown` and `cancelled` from ready, queued, success and failure; hosts own reconciliation and execution policy. See the [navigation](src/docs/NavigationDoc.svelte) and [graph](src/docs/graph/GraphDoc.svelte) examples.
