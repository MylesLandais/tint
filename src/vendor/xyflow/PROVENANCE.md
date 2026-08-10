# @xyflow/react + @xyflow/system — vendored

| | |
| --- | --- |
| Packages | `@xyflow/react@12.11.2`, `@xyflow/system@0.0.79` |
| License | MIT — see `LICENSE`, retained verbatim |
| Copyright | © 2019-2025 webkid GmbH |
| Upstream | https://github.com/xyflow/xyflow |
| Docs | https://reactflow.dev |
| React tarball | `xyflow-react-12.11.2.tgz` |
| React SHA-256 | `ddfb74037a3979ed98c8784034071f24040b5a6b7d560254fcb6c6676946da47` |
| System tarball | `xyflow-system-0.0.79.tgz` |
| System SHA-256 | `1b099ccb0022753fa8185647a9ad2dff9f02872ec6be7b40a052a89ba7d9e87a` |
| Bundle SHA-256 | `9d186202dde62f475c2366cd7c8c776aea8c58a68c9aadbd4772eb8a736d5502` |
| Bundled with | `@xyflow/system@0.0.79`, `zustand@^4.4`, `classcat@^5`, `d3-drag`, `d3-selection`, `d3-zoom`, `d3-interpolate` (and their transitive d3 deps) |
| Vendored | 2026-08-10 |

## Why vendored rather than depended on

Same deliberate choice as `yjs` and `@tanstack/table-core`: hold the graph-canvas
engine in-tree rather than track it as a dependency. Upgrades are a manual
re-vendor, not a version bump. The Application graph contracts stay independent
of xyflow types; only `src/components/graph/adapter/` imports this directory.

## What is here, and why a bundle

- `index.js` — esbuild ESM bundle of `@xyflow/react` with `@xyflow/system`,
  `zustand`, `classcat`, and d3 interaction deps inlined. Externals: `react`,
  `react-dom`, `react/jsx-runtime`.
- `index.d.ts` — focused ambient typings for the subset tint's adapter uses.
  Full upstream declaration trees are not vendored (they cross-import
  `@xyflow/system` / `zustand` module IDs that do not exist after bundling).
- `style.css` / `base.css` — upstream React Flow stylesheets.
- `LICENSE` — unmodified upstream MIT text.

Dropped: CJS/UMD builds, source maps, tests, and the unbundled multi-file ESM tree.

## Local modifications

Mechanical only. No xyflow behavior is patched.

1. `@xyflow/react` + transitive runtime deps → single `index.js` via esbuild
   (`--bundle --format=esm`, react externals).
2. `//# sourceMappingURL=` comments stripped. Maps are not vendored.
3. Focused `index.d.ts` written for the adapter surface (not a fork of upstream
   behavior).

If behavior is ever patched, say so here. A silently modified vendor directory
is how a dependency becomes a fork nobody remembers making.

## Upgrading

```bash
npm pack @xyflow/react@<version>
npm install --prefix /tmp/xyflow-pack --no-save @xyflow/react@<version> esbuild
npx esbuild node_modules/@xyflow/react/dist/esm/index.js \
  --bundle --format=esm --outfile=src/vendor/xyflow/index.js \
  --external:react --external:react-dom \
  --external:react/jsx-runtime --external:react/jsx-dev-runtime
# copy style.css, base.css, LICENSE; strip sourceMappingURL; update this file
```

Then update versions, checksums, and date above. Run `src/components/graph/` tests
and the docs graph page.

## How tint uses it

Only through `src/components/graph/adapter/`. Application code and the docs site
never import this directory directly — `InteractiveGraphView` is the seam, so a
future engine swap touches the adapter package.
