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
