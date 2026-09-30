# Tint consumer inventory

Read-only inventory on 2026-09-29. The active consumer checkout is `/home/warby/Workspace`, branch `feat/music-rename-lua` at `1d5363c1`. Its npm workspace resolves `@nebula/tint: "*"` to `third_party/tint`, a git submodule pinned at `3af9de6` (detached HEAD). The migration checkout is `/home/warby/Workspace-git/tint`, branch `svelte-dev` at `3849bdb`. Updating the upstream Tint branch alone does not change what Workspace builds; the submodule must be re-pinned after the Svelte cutover.

| Consumer | Current UI and Tint imports | Local validation command |
| --- | --- | --- |
| `@nebula/gateway-web` (`apps/gateway/web`) | React 19, React Vite plugin; Tint in 72 source files across 39 distinct package specifiers. Imports the root entry, foundation, forms, client/auth bindings, table, chat, media, graph, shell, and theme/style CSS. | `npm run check --workspace=@nebula/gateway-web` runs TypeScript, Vitest, and Vite build. Its `prebuild` also generates the taxonomy with `uv`. `npm run test:e2e --workspace=@nebula/gateway-web` is the browser gate. |
| `@nebula/workbench-web` (`workbench/apps/workbench/web`) | React 19, React Vite plugin, Tauri frontend; Tint in 7 source files across 8 specifiers: `/button`, `/code`, `/form`, `/form/styles.css`, `/framebuffer`, `/shell`, `/styles.css`, `/table`. | `npm run check --workspace=@nebula/workbench-web` runs TypeScript, Vitest, and Vite build. Tauri's `beforeBuildCommand` runs `npm run build --workspace=@nebula/workbench-web`; the separate Rust workspace can be checked with `cargo check --manifest-path workbench/Cargo.toml`. |
| `@nebula/booru-web` (`apps/booru/web`) | React 19; one `RecentDownloadsCarousel.tsx` imports `/badge` and `/button`. This package currently has component tests, not an app build script. | `npm run check --workspace=@nebula/booru-web` runs TypeScript and Vitest. |

Gateway's broad import surface includes `/auth`, `/auth-client`, `/badge`, `/button`, `/character-card`, `/chat`, `/client`, `/code-editor`, `/collab`, `/context-menu`, `/dialog`, `/form`, `/framebuffer`, `/graph`, `/icon`, `/media`, `/media-player`, `/menu`, `/panel`, `/progress`, `/release-chart`, `/scatter-plot`, `/settings-popout`, `/shell`, `/table`, `/theme`, `/toast`, and `/tree`. It also imports Tint's base, auth, form, graph, and six palette CSS entries. Its Vite configuration explicitly prebundles several Tint subpaths during development and deduplicates React; review that configuration when the React Tint runtime is removed. Workbench's Vite configuration also deduplicates React and excludes Tint from dependency optimization.

## Consumer cutover gate

1. Finish Svelte components and normalize Tint's public package subpaths so consumer imports can keep domain names such as `@nebula/tint/button` and `@nebula/tint/table`.
2. Migrate the three consumer UI call sites and tests, preserving framework-neutral Tint contracts and the existing CSS/theme imports. Remove consumer React usage only where the consumer itself no longer needs it.
3. Re-pin `third_party/tint` in Workspace to the tested Svelte Tint commit. Run `npm run check:tint`, each consumer check above, then the root `npm run check` and gateway browser tests. Validate the Tauri frontend build through its configured command.

No consumer build or test was run during this read-only inventory. Searches of package manifests in `/home/warby/Workspace`, `/home/warby/Workspace-git`, and `/home/warby/Workspace-internal` found no additional direct `@nebula/tint` consumer; the Tint package itself is the only match in `Workspace-git`. No direct `carbon-components-svelte` imports were found in the three consumer source trees.
