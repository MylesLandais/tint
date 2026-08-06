# @tanstack/table-core — vendored

| | |
| --- | --- |
| Package | `@tanstack/table-core` |
| Version | `8.21.3` |
| License | MIT — see `LICENSE`, retained verbatim |
| Copyright | © 2016 Tanner Linsley |
| Upstream | https://github.com/TanStack/table |
| Tarball | `tanstack-table-core-8.21.3.tgz` |
| SHA-256 | `1e5b2f4f04c8c31100ebd0b966fae5eadbb1d11bd45517edb9fc15fbd6a8f2a0` |
| Vendored | 2026-08-02 |

## Why vendored rather than depended on

A deliberate choice to hold the engine's source in-tree rather than track it as a dependency.
The trade is explicit: upgrades are a manual re-vendor, not a version bump.

## What is here, and why not the TypeScript source

The published tarball carries both `src/` (TypeScript) and `build/lib/` (compiled). The source
would be the nicer thing to vendor — it typechecks against our config and tree-shakes — but it
does not compile under this repo's settings: `verbatimModuleSyntax` is on, and upstream imports
types with value imports (`import { RowData } from './types'`), which produces a TS1484 error in
all 37 files.

Patching those imports would fork the source and re-fork it on every upgrade, which defeats the
point of pinning a version. So this vendors the published build instead — the same artifact `npm
install` would have produced:

- `index.js` — the self-contained ESM bundle (upstream `build/lib/index.mjs`, renamed so bundler
  module resolution pairs it with `index.d.ts`). It has no imports of its own.
- `*.d.ts` — the declaration tree. `skipLibCheck: true` exempts these from our strict settings.
- `LICENSE` — unmodified.

Dropped: CJS and UMD builds, source maps, and the `.js` files superseded by the bundle.

## Local modifications

Two, both mechanical. No behavior is patched — if that ever stops being true, say so here. A
silently modified vendor directory is how a dependency becomes a fork nobody remembers making.

1. `build/lib/index.mjs` → `index.js`, so bundler module resolution pairs the bundle with
   `index.d.ts`.
2. The trailing `//# sourceMappingURL=index.mjs.map` comment is stripped. The map is not vendored,
   and leaving the reference makes Vite log a failed map read on every load.

## Upgrading

```
npm pack @tanstack/table-core@<version>
tar xzf tanstack-table-core-<version>.tgz
cp package/build/lib/index.mjs      src/vendor/tanstack-table-core/index.js
find package/build/lib -name '*.d.ts' -exec cp --parents {} src/vendor/tanstack-table-core/ \;
cp package/LICENSE                  src/vendor/tanstack-table-core/LICENSE
```

Then update the version, checksum, and date above, and run the suite. `DataTable.test.tsx` is
written against behavior rather than internals, so it is the regression net for an engine change.

## How tint uses it

Only through `src/components/table/`. Application code and the docs site never import this
directory directly — `useDataTable.ts` is the single seam, so a future engine swap touches one
file.
