import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/** Keep the Svelte package map, root UI exports, and docs routes coherent. */
const ROOT = path.resolve(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
  exports: Record<string, string>
}
const entries = Object.entries(manifest.exports).filter(([, target]) => target.endsWith('.ts'))

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), 'utf8')
}

function resolveBarrel(from: string, specifier: string): string | undefined {
  const candidate = path.resolve(ROOT, path.dirname(from), specifier)
  for (const file of [`${candidate}.ts`, path.join(candidate, 'index.ts')]) {
    if (existsSync(file)) return path.relative(ROOT, file)
  }
}

function namedExports(file: string, visited = new Set<string>()): Set<string> {
  if (visited.has(file)) return new Set()
  visited.add(file)
  const source = read(file)
  const names = new Set<string>()
  for (const [, isType, body] of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s*from/g)) {
    if (isType) continue
    for (const entry of body.split(',')) {
      const cleaned = entry.trim()
      if (!cleaned || cleaned.startsWith('type ')) continue
      names.add((cleaned.split(/\s+as\s+/).pop() ?? cleaned).trim())
    }
  }
  for (const [, specifier] of source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveBarrel(file, specifier)
    if (target) for (const name of namedExports(target, visited)) names.add(name)
  }
  return names
}

function svelteComponents(file: string): Set<string> {
  const names = new Set<string>()
  for (const [, name] of read(file).matchAll(/export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*['"][^'"]+\.svelte['"]/g)) names.add(name)
  return names
}

const GROUPED_DOCS: Record<string, string> = {
  'media-player': 'media', 'video-player': 'media', 'settings-popout': 'media',
  'workspace-grid': 'workspace', 'media-workspace': 'workspace',
  'scatter-plot': 'release-chart', 'audio-engine': 'dj',
  'audio-workspace': 'midnight-128', 'timeline': 'graph',
}
const DOC_EXEMPT = new Set(['svelte', 'client/svelte', 'auth-client', 'socket'])

const SVELTE_COMPONENT_ROOT = path.join(ROOT, 'src/svelte/components')

describe('Svelte public package exports', () => {
  it('uses Svelte for the root and every public UI subpath', () => {
    expect(manifest.exports['.']).toBe('./src/svelte/index.ts')
    const legacyTargets = entries
      .filter(([subpath]) => !['./collab', './socket', './auth-client', './client'].includes(subpath))
      .filter(([, target]) => target.startsWith('./src/components/'))
    expect(legacyTargets).toEqual([])
  })

  it('declares a domain subpath for every production Svelte component package', () => {
    const componentTargets = new Set(entries.map(([, target]) => target))
    const missing = readdirSync(SVELTE_COMPONENT_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'testing' && existsSync(path.join(SVELTE_COMPONENT_ROOT, entry.name, 'index.ts')))
      .map((entry) => `./src/svelte/components/${entry.name}/index.ts`)
      .filter((target) => !componentTargets.has(target))
    expect(missing).toEqual([])
  })

  it('re-exports every public Svelte component from the root entry', () => {
    const root = namedExports('src/svelte/index.ts')
    const missing = entries
      .filter(([, target]) => target.startsWith('./src/svelte/components/') || target === './src/svelte/form/index.ts')
      .flatMap(([subpath, target]) => [...svelteComponents(target.slice(2))].filter((name) => !root.has(name)).map((name) => `${subpath}:${name}`))
    expect(missing).toEqual([])
  })

  it('documents every public UI package through a live Svelte page', () => {
    const routes = read('src/docs/svelte/routes.ts')
    const paths = new Set([...routes.matchAll(/path: 'components\/([^']+)'/g)].map((match) => match[1]))
    const missing = entries
      .map(([subpath]) => subpath.slice(2))
      .filter((name) => name && !DOC_EXEMPT.has(name) && !name.includes('/'))
      .filter((name) => !paths.has(GROUPED_DOCS[name] ?? name))
    expect(missing).toEqual([])
  })
})
