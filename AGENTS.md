# AGENTS.md

## Cursor Cloud specific instructions

`tint` is a single-service Vite + React 19 + TypeScript project: a component library (first component `VideoPlayer`) with a docs/preview site under `src/docs`. There is no backend, database, or auth.

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`) and `README.md`; use those rather than duplicating them here.

Non-obvious notes:
- Lint uses `oxlint` (see `.oxlintrc.json`), not ESLint.
- The dev server runs on `http://localhost:5173`. It does not auto-expose on the network; add `--host` only if external access is needed.
- The live docs preview loads its demo video from an external Pexels URL (`src/docs/VideoPlayerDoc.tsx`), so the video area needs outbound internet to render; an empty player usually means blocked egress, not a code bug.
