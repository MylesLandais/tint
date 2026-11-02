#!/usr/bin/env node
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { filesUnder, json, ROOT, sha256 } from './design-tokens.mjs'

const FIRST_SLICE = new Set([
  'ConnectionStatus', 'StatusIcon', 'Badge', 'Skeleton', 'EmptyState', 'ErrorState',
  'ProgressBar', 'Typeahead', 'Select', 'SelectField', 'Menu', 'Popover',
  'ChatComposer', 'ChatMessage', 'ChatMessageList', 'ChatPart', 'ChatAudio',
  'AudioPlayer', 'MediaPlayer', 'Waveform', 'CharacterLibrary',
  'CharacterDocumentEditor', 'PersonaEditor', 'FileField', 'Button', 'Surface', 'Card',
])
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

function resolveSource(root, from, specifier) {
  if (!specifier.startsWith('.')) return null
  const base = relative(root, resolve(root, dirname(from), specifier))
  return [base, `${base}.ts`, `${base}/index.ts`].find((path) => existsSync(join(root, path)) && statSync(join(root, path)).isFile()) ?? null
}

// Follow the public package barrels so internal wrappers remain distinguishable
// from components consumers can import. Type-only exports are not canvas items.
export function publicComponents(root = ROOT) {
  const cache = new Map()
  function exportsFrom(path) {
    if (cache.has(path)) return cache.get(path)
    const found = new Map()
    cache.set(path, found)
    const source = ts.createSourceFile(path, readFileSync(join(root, path), 'utf8'), ts.ScriptTarget.Latest, true)
    for (const statement of source.statements) {
      if (!ts.isExportDeclaration(statement) || statement.isTypeOnly || !statement.moduleSpecifier) continue
      const target = resolveSource(root, path, statement.moduleSpecifier.text)
      if (!target) continue
      const clause = statement.exportClause
      if (target.endsWith('.svelte')) {
        if (clause && ts.isNamedExports(clause)) {
          for (const item of clause.elements) if (!item.isTypeOnly) found.set(item.name.text, target)
        }
      } else if (target.endsWith('.ts')) {
        const nested = exportsFrom(target)
        if (!clause) for (const [name, component] of nested) found.set(name, component)
        else if (ts.isNamedExports(clause)) {
          for (const item of clause.elements) {
            const component = nested.get((item.propertyName ?? item.name).text)
            if (!item.isTypeOnly && component) found.set(item.name.text, component)
          }
        }
      }
    }
    return found
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const components = new Map()
  for (const [subpath, path] of Object.entries(pkg.exports)) {
    if (!path.endsWith('.ts')) continue
    for (const [name, source] of exportsFrom(path)) {
      const exports = components.get(source) ?? []
      exports.push({ entrypoint: `${pkg.name}${subpath === '.' ? '' : subpath.slice(1)}`, name })
      components.set(source, exports)
    }
  }
  return components
}

export function mappingStatus(design, sourceSha256) {
  const values = [design.fileId, design.componentId]
  assert(values.every((value) => value === null || (typeof value === 'string' && UUID.test(value))), 'Penpot IDs must be UUIDs or null')
  assert(values.every((value) => value === null) || values.every((value) => value !== null), 'Record both Penpot fileId and componentId together')
  if (design.fileId === null) {
    assert(design.validatedSourceSha256 === null, 'An unimported component cannot have a validated source')
    return 'pending-import'
  }
  return design.validatedSourceSha256 === sourceSha256 ? 'mapped' : 'needs-review'
}

export function buildInventory(root = ROOT, previous = { components: [] }) {
  const exports = publicComponents(root)
  const paths = filesUnder(root, 'src/svelte').filter((path) => path.endsWith('.svelte') && !path.includes('/design-lab/') && !/(?:Fixture|Probe)\.svelte$/.test(path))
  const old = new Map(previous.components.map((component) => [component.source, component]))
  assert(old.size === previous.components.length, 'Duplicate component source paths')
  const components = paths.map((source) => {
    const prior = old.get(source)
    const name = source.split('/').at(-1).slice(0, -7)
    const sourceSha256 = sha256(readFileSync(join(root, source)))
    const penpot = prior?.penpot ?? { fileId: null, componentId: null, validatedSourceSha256: null }
    return {
      id: prior?.id ?? `tint.${source.replace('src/svelte/', '').replace(/^components\//, '').replace(/\.svelte$/, '').replaceAll('/', '.')}`,
      source, sourceSha256, exports: exports.get(source) ?? [],
      priority: FIRST_SLICE.has(name) ? 'voice-client' : 'backlog',
      penpot, status: mappingStatus(penpot, sourceSha256),
    }
  })
  assert(new Set(components.map((component) => component.id)).size === components.length, 'Duplicate component IDs')
  for (const component of previous.components) {
    assert(paths.includes(component.source) || component.penpot.componentId === null,
      `${component.source}: explicitly migrate the existing Penpot mapping before removing its source`)
  }
  const sourceTreeSha256 = sha256(json(components.map(({ source, sourceSha256 }) => ({ source, sourceSha256 }))))
  return { schemaVersion: 1, library: 'Tint UI Kit', sourceTreeSha256, components }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  assert(args.length === 1 && ['--write', '--check', '--report'].includes(args[0]), 'Usage: node scripts/design-inventory.mjs --write|--check|--report')
  const path = join(ROOT, 'design/penpot/component-map.json')
  const previous = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { components: [] }
  const next = buildInventory(ROOT, previous)
  if (args[0] === '--write') {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, json(next))
  } else {
    assert(existsSync(path) && readFileSync(path, 'utf8') === json(next), 'Component mapping drift. Run node scripts/design-inventory.mjs --write')
  }
  const counts = Object.fromEntries(['pending-import', 'needs-review', 'mapped'].map((status) => [status, next.components.filter((component) => component.status === status).length]))
  console.log(json({ components: next.components.length, publicComponents: next.components.filter((component) => component.exports.length).length, voiceClientPriority: next.components.filter((component) => component.priority === 'voice-client').length, ...counts }).trim())
}
