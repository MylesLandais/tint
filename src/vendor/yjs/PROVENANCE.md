# yjs — vendored

| | |
| --- | --- |
| Package | `yjs` |
| Version | `13.6.32` |
| License | MIT — see `LICENSE`, retained verbatim |
| Copyright | © 2023 Kevin Jahns; Chair of Computer Science 5, RWTH Aachen University |
| Upstream | https://github.com/yjs/yjs |
| Docs | https://docs.yjs.dev/getting-started/a-collaborative-editor |
| Tarball | `yjs-13.6.32.tgz` |
| SHA-256 | `dbca91b1729235d44dce944813c800dd910ec2e2c5f6acf55ccbda3bbb828009` |
| Bundled with | `lib0@0.2.99` (MIT) |
| Vendored | 2026-08-07 |

## Why vendored rather than depended on

Same deliberate choice as `@tanstack/table-core`: hold the CRDT engine in-tree rather than
track it as a dependency. Upgrades are a manual re-vendor, not a version bump.

Yjs v13's published `dist/yjs.mjs` still imports `lib0/*`. Tint's table vendor is a
self-contained ESM file with no imports of its own. To keep that property, this directory
holds an esbuild bundle of `yjs.mjs` + `lib0`, not the raw tarball module.

Do not vendor Yjs v14 (`@y/y`) yet — `main` on the clone is the v14 RC. Tint pins **v13**.

## What is here, and why not the TypeScript source

- `index.js` — esbuild ESM bundle of `dist/yjs.mjs` with `lib0` inlined. No imports.
- `*.d.ts` — declaration tree from `dist/src/`. `skipLibCheck: true` exempts most of these.
- `lib0-shims.d.ts` — ambient `lib0/*` modules so `Doc` inherits `on` / `off` / `destroy`.
- `LICENSE` — unmodified upstream MIT text.

Dropped: CJS, source maps, tests, and the unbundled `src/` that imports `lib0`.

## Local modifications

Mechanical only. No Yjs behavior is patched.

1. `dist/yjs.mjs` + `lib0` → single `index.js` via esbuild (`--bundle --format=esm`).
2. `//# sourceMappingURL=` comments stripped from all vendored `.d.ts` files. Maps are not vendored.
3. `lib0-shims.d.ts` added — lib0 JS is bundled, but upstream `.d.ts` still import `lib0/observable`.

If behavior is ever patched, say so here. A silently modified vendor directory is how a
dependency becomes a fork nobody remembers making.

## Upgrading

```
npm pack yjs@<version>
tar xzf yjs-<version>.tgz
npm install lib0@<yjs peer / package.json dependency> --prefix /tmp/yjs-pack --no-save
npx esbuild package/dist/yjs.mjs --bundle --format=esm --outfile=src/vendor/yjs/index.js
rsync -a --include='*/' --include='*.d.ts' --exclude='*' package/dist/src/ src/vendor/yjs/
cp package/LICENSE src/vendor/yjs/LICENSE
```

Strip any `sourceMappingURL` left on `index.d.ts`. Update version, checksum, lib0 pin, and
date above. Run `src/components/collab/` tests.

## How tint uses it

Only through `src/components/collab/`. Application code and the docs site never import this
directory directly — `createCollabSession` is the seam, so a future engine swap touches that
file. Editor bindings (`y-prosemirror`, TipTap Collaboration) stay out of this vendor dir.
