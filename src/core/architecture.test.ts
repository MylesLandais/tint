import { globSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Migration boundary rules.
 *
 * `src/core` is importable from plain Node: no React, no Svelte, no component
 * files. `src/svelte` is the Svelte binding layer and must not reach into React.
 * Reads source instead of importing it so the check itself boots no framework.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')
const IMPORT = /(?:from\s*|import\s*\(?\s*|@import\s+)['"]([^'"]+)['"]/g
const FRAMEWORK = /^(react|react-dom|svelte)(\/|$)/

function importsOf(file: string): string[] {
  const source = readFileSync(path.join(ROOT, file), 'utf8')
  return [...source.matchAll(IMPORT)].map((match) => match[1])
}

function sourcesIn(dir: string) {
  return globSync(`${dir}/**/*.{ts,tsx,svelte}`, { cwd: ROOT })
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
}

describe('src/core', () => {
  it('imports no framework or component files', () => {
    const offenders = sourcesIn('src/core').flatMap((file) =>
      importsOf(file)
        .filter((spec) => FRAMEWORK.test(spec) || /\.(tsx|svelte)$/.test(spec))
        .map((spec) => `${file} -> ${spec}`),
    )
    expect(offenders).toEqual([])
  })

  it('contains only .ts files', () => {
    expect(sourcesIn('src/core').filter((file) => !file.endsWith('.ts'))).toEqual([])
  })
})

describe('src/svelte', () => {
  it('does not import React', () => {
    const offenders = sourcesIn('src/svelte').flatMap((file) =>
      importsOf(file)
        .filter((spec) => /^(react|react-dom)(\/|$)/.test(spec) || /\.tsx$/.test(spec))
        .map((spec) => `${file} -> ${spec}`),
    )
    expect(offenders).toEqual([])
  })

  it('does not import the client barrel (it re-exports the React adapter)', () => {
    const offenders = sourcesIn('src/svelte').flatMap((file) =>
      importsOf(file)
        .filter((spec) => /(^|\/)\.\.\/client(\/index|\/react)?$/.test(spec))
        .map((spec) => `${file} -> ${spec}`),
    )
    expect(offenders).toEqual([])
  })
})
