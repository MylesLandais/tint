# Workspace names and compatibility

Maintained implementation, docs and examples use Workspace. The collection API is
`CollectionWorkspace`; its plain TypeScript helpers are `collectionWorkspaceLayout`,
`deriveWorkspaceRows`, `CollectionWorkspaceLayout`, `WorkspaceQuery` and
`WorkspaceInspectorTab` from `@nebula/tint/table`. `DataTable` accepts
`workspaceResponsive`; an explicit new value, including false, wins over the old
prop. Hosts still own row/query selection, sorting, proposals, saved layout and
inspector state. This rename does not rewrite stored documents or storage keys.

For one release the public barrels also retain deprecated `CollectionWorkbench`,
`workbenchLayout`, `deriveWorkbenchRows`, `WorkbenchLayout`, `WorkbenchQuery`,
`WorkbenchInspectorTab` and `workbenchResponsive`. Aliases live under
`src/core/compatibility` and `src/svelte/compatibility`; the component alias has the
same identity. Old collection/responsive data attributes remain there for existing
consumer styles; maintained components/tests select the new attributes. No old
implementation directory or second component is retained.

Framebuffer helpers are public at `@nebula/tint/framebuffer`:

```ts
const { accounts, protocol } = await discoverWorkspaceSessions(signal)
const url = workspaceFrameUrl(location.href, accounts[0], protocol)
```

Discovery posts to `/api/workspace/list_sessions` with `X-Workspace-Client`.
Only HTTP 404 permits a read-only fallback to the legacy namespace. The returned
protocol binds subsequent frame URLs to that same namespace. Authorization,
conflict, service errors, aborts, malformed responses and transport failures never
trigger fallback. `fetchWorkspaceSessions` returns only IDs for callers that do
not need a stream. `workbenchSessionIds` and `fetchWorkbenchSessions` remain
aliases; `workbenchFrameUrl` preserves its old stream namespace. No game input is
sent by these helpers.

Vite's docs preview accepts both namespaces. Set `NEBULA_WORKSPACE_URL` to select
the runtime; the previous `ENDLESS_WORKBENCH_URL` remains a fallback for this
release. The new value wins when both exist. HTTP/WS same-origin restrictions are
unchanged; cross-origin WebSocket requests are rejected before proxying.

`npm run check:names` scans maintained source/configuration, paths and docs.
`migration/workspace-names.json` records exact compatibility/test files and the two
immutable review snapshots. It is enforced by `npm run check`; new legacy names
outside those boundaries fail. Run `npm run migration:refresh` after source moves
and regenerate the docs graph. Focused compatibility and docs browser tests cover
new/old configuration, responsive prop precedence, session discovery, stream URLs
and the public aliases. Fixture results do not qualify a real game client.
