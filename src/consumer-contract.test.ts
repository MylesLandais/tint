import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * The package has to typecheck from *outside* the package.
 *
 * Tint ships TypeScript source — `exports` points at `./src/*.ts`, there is no
 * build step — so a consumer's `tsc` compiles this repo's files inside the
 * consumer's program, under the consumer's `tsconfig.json`. That is a different
 * program from the one `npm run build` checks here, and the difference is not
 * cosmetic: `tsconfig.app.json` says `"include": ["src"]`, which sweeps in every
 * ambient `.d.ts` under `src/` whether or not anything imports it. A consumer
 * includes *their* `src`, so our ambient declarations reach their program only
 * if something in the import graph pulls them in.
 *
 * `src/vendor/yjs/lib0-shims.d.ts` is exactly that kind of file. It declares the
 * `lib0/*` modules that the vendored Yjs `.d.ts` tree imports — `lib0` itself is
 * bundled into `index.js`, so those modules exist at type level only. Nothing
 * imported the shim. Here, `include: ["src"]` loaded it and everything passed.
 * In a consumer, `lib0/observable` resolved to nothing, `Doc extends
 * ObservableV2<DocEvents>` lost its base, and `tint/collab` failed to compile
 * with three errors the consumer could do nothing about:
 *
 *     broadcast.ts(76,7):  Property 'on' does not exist on type 'Doc'.
 *     broadcast.ts(104,9): Property 'off' does not exist on type 'Doc'.
 *     createCollabSession.ts(50,11): Property 'destroy' does not exist on type 'Doc'.
 *
 * `skipLibCheck` hid it inside the `.d.ts` tree; these two are `.ts`, so it
 * surfaced. The fix is a `/// <reference>` from `src/vendor/yjs/index.d.ts`,
 * which puts the shim in the import graph where a consumer will follow it.
 *
 * So: build a program the way a host does — our sources reached only through
 * imports, never through `include` — and require it to be clean.
 */
const ROOT = path.resolve(import.meta.dirname, '..')

const packageJson = JSON.parse(
  readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
) as { exports: Record<string, string> }

/** Every entry point that resolves to TypeScript. CSS subpaths are not programs. */
const ENTRY_POINTS = Object.entries(packageJson.exports)
  .filter(([, target]) => target.endsWith('.ts'))
  .map(([subpath, target]) => ({ subpath, target }))

/**
 * A host's compiler options, not ours. Deliberately plain: this is the common
 * denominator of a Vite + React app, and notably it does *not* set `paths`,
 * `baseUrl`, or a `types` array that would drag in anything of ours.
 */
const HOST_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  resolveJsonModule: true,
}

describe('consumer contract', () => {
  it('typechecks every entry point from a host program', () => {
    // One synthetic host file importing every entry point. A single program
    // keeps this affordable; the entry points share most of their graph anyway.
    const hostFile = path.join(ROOT, '__consumer_contract__.ts')
    const source = ENTRY_POINTS.map(
      ({ target }, i) => `import * as e${i} from '${target}'`,
    ).join('\n')

    const host = ts.createCompilerHost(HOST_OPTIONS, true)
    const readFile = host.readFile.bind(host)
    const fileExists = host.fileExists.bind(host)
    host.readFile = (name) => (name === hostFile ? source : readFile(name))
    host.fileExists = (name) => name === hostFile || fileExists(name)

    const program = ts.createProgram([hostFile], HOST_OPTIONS, host)

    // Only real typecheck errors. Options diagnostics would report on the
    // synthetic file itself, which is scaffolding, not a finding.
    const diagnostics = [
      ...program.getSemanticDiagnostics(),
      ...program.getSyntacticDiagnostics(),
    ].filter((d) => d.file?.fileName !== hostFile)

    const formatted = diagnostics.map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, ' ')
      if (!d.file || d.start === undefined) return message
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start)
      const where = path.relative(ROOT, d.file.fileName)
      return `${where}(${line + 1},${character + 1}): ${message}`
    })

    expect(formatted).toEqual([])
    // Builds and checks a whole program over every entry point, so it runs in
    // seconds, not milliseconds — well past the default per-test timeout when
    // the rest of the suite is running alongside it.
  }, 120_000)
})
