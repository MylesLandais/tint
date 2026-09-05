# Tint component and demo inventory

This inventory records the public surface and the examples that exercise it. The
docs route table remains the source of truth for navigation; this file is the
review snapshot for the PokéForce integration work.

## Public surface

Tint currently exposes 45 TypeScript subpaths, including the new `tint/tile-map`
package, plus the root package and stylesheet/theme entries. The component tree
contains 48 directories. Engine-specific dependencies stay behind adapters and
are not public contracts.

| Area | Packages and examples |
| --- | --- |
| Media | `media-player`, `video-player`, `media`, `audio-input`, `settings-popout`, `media-assets`, `tile-map`; Big Buck Bunny, Midnight 128, and the New Bark mock map |
| Chat and content | `chat`, `editor`, `code`, `terminal`, `feed`, `activity`, `notify`; Zulip topic threads, markdown/code tabs, feed fixtures |
| Data and infra | `table`, `graph`, `telemetry`, `board`, `calendar`, `collab`, `policy`, `socket`, `auth`, `client`; music/masonry collections, graph projections, service map, calendar workbench, client framework |
| Foundations and layout | `identity`, `surface`, `status`, `navigation`, `menu`, `charts`, `workspace-grid`, `form`, `character-card`; shared client framework and workspace demos |
| Theming and primitives | `theme`, `icon`, `dice`, `panel`, `badge`, `button`, `progress`, `scrolling-label`, `dialog`, `context-menu`, `tree`, `toast` |

## Demo coverage

Every docs route is registered in `src/docs/routes.ts` and mapped in
`src/docs/pages.tsx`. The new Tile Map route demonstrates a controlled viewport,
collision-aware movement, interaction intent, and the mock/live service seam.

The first PokéForce slice intentionally covers only exploration: map cells,
collision, player position, follower/entity rendering, and the laboratory
interaction. Battles, inventory, quests, dialogue, and full-world coverage are
not represented as implemented capabilities.

## Validation

- Focused Tile Map tests cover accessible rendering, valid movement, blocked
  movement, and interaction intent.
- Route and export tests cover the public subpath and docs registration.
- `scripts/gen-docs-graph.py` was rerun after adding the package.
- Existing baseline checks remain: 908 tests passed before this slice; the
  production build and Playwright DJ demo passed.
