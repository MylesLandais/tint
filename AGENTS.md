# AGENTS.md

## Cursor Cloud specific instructions

`tint` is a Svelte 5 component library. Framework-neutral behavior lives in TypeScript under `src/core`; the Svelte presentation layer is under `src/svelte`, and the existing docs/preview site is under `src/docs`. There is no backend or database in this repository.

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and `README.md`; use those rather than duplicating them here.

Non-obvious notes:
- Lint uses `oxlint` (see `.oxlintrc.json`), not ESLint.
- The dev server has a strict repo-owned binding at `127.0.0.1:45173`; it must fail rather than silently hop to another repo's port.
- The canonical browser URL is `http://tint.localhost`, routed by the local NixOS Traefik configuration to port `45173`. Use `http://127.0.0.1:45173` only as a direct-proxy bypass for diagnosis.
- The live docs preview loads its demo video from a local asset (`public/videos/big-buck-bunny.mp4`, referenced in `src/docs/MediaDoc.svelte`) — no outbound internet needed to render it.

Docs-site architecture:
- `index.html` mounts the Svelte docs at `/`. `svelte-docs.html` redirects old bookmarks to the root while preserving their hashes.
- `src/docs/svelte/DocsApp.svelte` owns the header, grouped navigation, route search, responsive sidebar, and on-page navigation. Individual pages render their own live examples inside `src/docs/svelte/DocPage.svelte`.
- `src/docs/svelte/routes.ts` is the route registry and includes aliases for retired React docs paths. Add each new page there so the sidebar and overview stay in sync. `src/docs/svelte/routing.test.ts` checks route and alias integrity.
- The Dependency Graph page (`src/docs/graph/DependencyGraphDoc.svelte`) renders Tint's `InteractiveGraphView` from `src/docs/generated/docsGraph.ts`, produced by `python3 scripts/gen-docs-graph.py`. Re-run it after changing cross-component imports; `src/docs/componentGraph.test.ts` fails when the generated data is stale.

Svelte architecture (branch `svelte-dev`):
- `src/core/` is framework-neutral TypeScript. It may not import UI frameworks, `.svelte` files, or component directories. New state machines, filtering, selection, parsers, and contracts belong here.
- `src/svelte/` is the public Svelte component and binding layer. The root package export points to `src/svelte/index.ts`; applications use public Tint imports rather than internal source paths.
- Vitest uses one Svelte-capable project (`vitest.config.ts`). `src/test/setup.ts` installs the shared DOM test helpers.
- Svelte 5 is a required peer dependency. React is not part of the source, package API, dependency graph, or test runtime. `npm run check:migration` enforces zero React source/dependencies and the generated inventory.
- Carbon Components Svelte is a private Tint implementation dependency. Only approved `src/svelte` implementation directories may import it; applications and docs import Tint's public components. `npm run check:migration` enforces the boundary.
- `npm run check` runs the migration guard, `tsc -b`, `svelte-check`, lint, and tests; `build` also runs `svelte-check`.
- The live Design Lab is `design-lab.html` and `src/svelte/design-lab`; it is linked from the docs sidebar and exercises public foundation components across themes and control states.
- Dataset editor (`#/components/table`): Svelte-first. Pure logic is in `src/core/table` (`fieldValues`, `editor`, `schema`, `history`); components are `DatasetGrid`/`DatasetEditor`/`ViewBar`/`RecordPanel`/`FieldMenu` in `src/svelte/components/table`, with `createDatasetStore` as optional rune state.
- The docs "Big" dataset is `public/data/books.json` (17k Open Library works, CC0), produced by `python3 scripts/gen-books.py`; it is fetched lazily by `src/docs/svelte/DatasetDemo.svelte` and never bundled into the library.
- Auth forms (`#/components/auth-forms`): Svelte-first. Pure logic (provider registry, last-used memory, `validateRegistration`) is in `src/core/auth`; `AuthLayout`/`LoginForm`/`RegistrationForm`/`OAuthButtons`/`ProviderMark` are in `src/svelte/components/auth`. The client records `AuthSnapshot.lastUsedMethod` from each session's first `authenticationMethods` entry. There is no OAuth server in tint yet (better-auth was the prior server); a vendored server must satisfy `AuthTransport`, as described on the docs page's "Server contract" section. The docs demo completes provider sign-in in memory via `createDemoTransport().completeOAuth`.
