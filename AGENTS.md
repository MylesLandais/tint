# AGENTS.md

## Cursor Cloud specific instructions

`tint` is a single-service Vite + React 19 + TypeScript project: a component library (first component `MediaPlayer`, a unified audio/video surface) with a docs/preview site under `src/docs`. There is no backend, database, or auth.

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and `README.md`; use those rather than duplicating them here.

Non-obvious notes:
- Lint uses `oxlint` (see `.oxlintrc.json`), not ESLint.
- The dev server has a strict repo-owned binding at `127.0.0.1:45173`; it must fail rather than silently hop to another repo's port.
- The canonical browser URL is `http://tint.localhost`, routed by the local NixOS Traefik configuration to port `45173`. Use `http://127.0.0.1:45173` only as a direct-proxy bypass for diagnosis.
- The live docs preview loads its demo video from a local asset (`public/videos/big-buck-bunny.mp4`, referenced in `src/docs/MediaPlayerDoc.tsx`) — no outbound internet needed to render it.
