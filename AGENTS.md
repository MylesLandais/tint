# AGENTS.md

## Cursor Cloud specific instructions

`tint` is a single-service Vite + React 19 + TypeScript project: a component library (first component `MediaPlayer`, a unified audio/video surface) with a docs/preview site under `src/docs`. There is no backend, database, or auth.

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and `README.md`; use those rather than duplicating them here.

Non-obvious notes:
- Lint uses `oxlint` (see `.oxlintrc.json`), not ESLint.
- The dev server has a strict repo-owned binding at `127.0.0.1:45173`; it must fail rather than silently hop to another repo's port.
- The canonical browser URL is `http://tint.localhost`, routed by the local NixOS Traefik configuration to port `45173`. Use `http://127.0.0.1:45173` only as a direct-proxy bypass for diagnosis.
- The live docs preview loads its demo video from a local asset (`public/videos/big-buck-bunny.mp4`, referenced in `src/docs/MediaPlayerDoc.tsx`) — no outbound internet needed to render it.

Docs-site architecture (redesigned 2026-08, modeled on Mintlify/docs.rs/Quartz):
- `src/docs/shell/DocsShell.tsx` owns all page chrome: sticky header (search palette on ⌘K via `shell/SearchPalette.tsx`), grouped sidebar, and a scroll-spy TOC rail. Pages never render their own nav.
- `src/docs/routes.ts` is the single source of truth: `ROUTE_DATA` (paths, blurbs, TOC sections) plus `ROUTE_GROUPS` (sidebar grouping). Adding a page requires an entry there and in `src/docs/pages.tsx` (`DOC_PAGES` is a `satisfies` record — drift is a compile error).
- `src/docs/components/DocsPage.tsx` holds the shared content furniture: `DocsPage` frame (with copy-import/copy-page actions and prev/next pager), `DocsSection`, `DocsDemo` (live demo + "Show code"), `DocsCallout`, `DocsTabs` (scenarios only, never routes), `DocsFooter`. API sections lead with the real TS prop signature above each `PropsTable`.
- The Dependency Graph page (`src/docs/ComponentGraphDoc.tsx`) renders tint's own `InteractiveGraphView` from `src/docs/generated/docsGraph.ts`, produced by `python3 scripts/gen-docs-graph.py` — re-run it after changing cross-component imports; `componentGraph.test.ts` fails when the committed data is stale.

Svelte migration (branch `svelte-dev`, based on `feat/publish-nebula-package`; React and Svelte coexist, React is not deleted until a Svelte equivalent is proven):
- `src/core/` is framework-neutral TypeScript. It may not import `react`, `react-dom`, `svelte`, `.tsx` or `.svelte` files, and may contain only `.ts`. New framework-neutral logic (state machines, filtering, selection, parsers, contracts) goes here, not in a component folder. Existing pure `.ts` modules move here only when the component that owns them is migrated.
- `src/svelte/` is the Svelte binding layer. It may depend on core, but not on React or `.tsx`, and not on the `src/client` barrel (it re-exports the React adapter; import `src/client/client` types directly). Both rules are enforced by `src/core/architecture.test.ts`.
- Vitest has two projects, `react` and `svelte` (`vitest.config.ts`). `svelteTesting()` applies the `browser` resolve condition globally, which breaks unrelated React tests, so it is confined to the `svelte` project (`src/svelte/**/*.test.ts`).
- `react` stays a required peer dependency while both frameworks coexist; `svelte` is an optional peer while `@nebula/tint/svelte` is an opt-in migration surface.
- `npm run check` runs `tsc -b`, `svelte-check` (via `tsconfig.svelte.json`), lint and tests; `build` also runs `svelte-check`.
- Carbon is a token and pattern reference, not a dependency. Do not add `carbon-components-svelte`.
