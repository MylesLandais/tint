# Tint

Tint is a Svelte 5 component library for media, chat, editing, data, and workbench interfaces. Components render host-owned state and report user intent through props and callbacks. Framework-neutral models and engines live in plain TypeScript under `src/core`.

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

## Source layout

- `src/core/`: framework-neutral contracts, state machines, parsers, and engines (including `core/auth` provider registry, last-used memory and registration validation).
- `src/svelte/`: public Svelte components and bindings. `src/svelte/index.ts` is the root API.
- `src/docs/`: Svelte docs pages, fixtures, route registry, and generated graph data. Docs are not published.
- `src/styles/` and `src/index.css`: semantic tokens, palettes, and component styles.
- `src/vendor/`: vendored Yjs and TanStack table engine with provenance and boundary checks.
- `src/auth/client/` and `src/client/`: transport-neutral client contracts and adapters.
- `e2e/`: browser behavior checks.

## Workspace and releases

The Workspace gateway consumes Tint as a pinned git submodule at `third_party/tint`; published consumers move by package version. Make library changes in this checkout, land them on `main`, then advance the gateway's submodule pin and run its `npm run check`. The consumer contract test here checks package entry points under a host TypeScript program before a pin or release moves.

To publish, update `version` in `package.json` on `dev`, commit, and push a matching `v<version>` tag to Forgejo. The [release workflow](.forgejo/workflows/release.yml) runs checks and publishes with `FORGEJO_NPM_TOKEN`. `publishConfig` fixes the target registry to Forgejo. More repository history and mirror details are in [docs/git-history.md](docs/git-history.md).
