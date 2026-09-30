import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/** The committed Svelte dependency graph must match the source import graph. */
const ROOT = path.resolve(import.meta.dirname, '../..')
const COMPONENTS = path.join(ROOT, 'src/svelte/components')
const FORM = path.join(ROOT, 'src/svelte/form')
const PACKAGES = new Map(
  readdirSync(COMPONENTS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'testing' && existsSync(path.join(COMPONENTS, entry.name, 'index.ts')))
    .map((entry) => [entry.name, path.join(COMPONENTS, entry.name)]),
)
PACKAGES.set('form', FORM)

type GeneratedNode = { id: string; imports: string[]; position: { x: number; y: number } }

function readGenerated(): GeneratedNode[] {
  const text = readFileSync(path.join(ROOT, 'src/docs/generated/docsGraph.ts'), 'utf8')
  const entryRe = /\{ id: "([^"]+)", imports: \[([^\]]*)\], position: \{"x": (-?\d+), "y": (-?\d+)\} \},/g
  return [...text.matchAll(entryRe)].map((match) => ({
    id: match[1],
    imports: [...match[2].matchAll(/"([^"]+)"/g)].map((dependency) => dependency[1]),
    position: { x: Number(match[3]), y: Number(match[4]) },
  }))
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}

function packageFor(file: string): string | undefined {
  for (const [name, directory] of PACKAGES) {
    const relative = path.relative(directory, file)
    if (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) return name
  }
}

function scanImportGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  const importRe = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g
  for (const [name, directory] of [...PACKAGES].sort(([left], [right]) => left.localeCompare(right))) {
    const dependencies = new Set<string>()
    for (const file of walk(directory).sort()) {
      if (!/\.(?:ts|svelte)$/.test(file) || /\.(?:test|spec)\./.test(file) || /(?:Fixture|Harness|Probe)/.test(path.basename(file))) continue
      for (const match of readFileSync(file, 'utf8').matchAll(importRe)) {
        const dependency = packageFor(path.resolve(path.dirname(file), match[1]))
        if (dependency && dependency !== name) dependencies.add(dependency)
      }
    }
    graph.set(name, [...dependencies].sort())
  }
  return graph
}

describe('Svelte docs dependency graph data', () => {
  const nodes = readGenerated()

  it('contains every production Svelte component package', () => {
    expect(nodes.map((node) => node.id).sort()).toEqual([...PACKAGES.keys()].sort())
  })

  it('keeps every edge endpoint on an existing node', () => {
    const names = new Set(nodes.map((node) => node.id))
    for (const node of nodes) {
      for (const dependency of node.imports) {
        expect(names, `${node.id} imports unknown package ${dependency}`).toContain(dependency)
        expect(dependency).not.toBe(node.id)
      }
    }
  })

  it('gives every node a distinct deterministic position', () => {
    const positions = nodes.map((node) => `${node.position.x}:${node.position.y}`)
    expect(new Set(positions).size).toBe(positions.length)
  })

  it('matches source imports after generator refresh', () => {
    const generated = Object.fromEntries(nodes.map((node) => [node.id, node.imports]))
    const scanned = Object.fromEntries(scanImportGraph())
    expect(generated).toEqual(scanned)
  })
})
