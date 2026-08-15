import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Keeps the Dependency Graph docs page honest.
 *
 * The page renders committed data (src/docs/generated/docsGraph.ts) produced by
 * scripts/gen-docs-graph.py, so it can silently drift from the real import
 * graph. These tests re-run the generator's scan in TypeScript and compare —
 * like propsTable.test.ts, the data is read off disk rather than imported, so
 * this stays a Node-side test in tsconfig.node.json.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')
const COMPONENTS_DIR = path.join(ROOT, 'src/components')

type GeneratedNode = { id: string; imports: string[]; position: { x: number; y: number } }

/** Parses the generated file's one-node-per-line entries back into data. */
function readGenerated(): GeneratedNode[] {
  const text = readFileSync(path.join(ROOT, 'src/docs/generated/docsGraph.ts'), 'utf8')
  const entryRe = /\{ id: "([^"]+)", imports: \[([^\]]*)\], position: \{"x": (-?\d+), "y": (-?\d+)\} \},/g
  return [...text.matchAll(entryRe)].map((m) => ({
    id: m[1],
    imports: m[2] ? [...m[2].matchAll(/"([^"]+)"/g)].map((d) => d[1]) : [],
    position: { x: Number(m[3]), y: Number(m[4]) },
  }))
}

/** Docs route paths (`path: '...'` literals in routes.ts). */
function readRoutePaths(): string[] {
  const text = readFileSync(path.join(ROOT, 'src/docs/routes.ts'), 'utf8')
  return [...text.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
}

/**
 * `GROUPED_ROUTE_MEMBERS` from routes.ts: route path -> component directories.
 *
 * Read as text for the same reason the rest of this file is — the assertion is
 * about what the source declares.
 */
function readGroupedMembers(): Map<string, string[]> {
  const text = readFileSync(path.join(ROOT, 'src/docs/routes.ts'), 'utf8')
  const block = text.match(/GROUPED_ROUTE_MEMBERS = \{([\s\S]*?)\n\}/)
  const grouped = new Map<string, string[]>()
  if (!block) return grouped
  for (const [, route, members] of block[1].matchAll(/'([^']+)':\s*\[([^\]]*)\]/g)) {
    grouped.set(route, [...members.matchAll(/'([^']+)'/g)].map((m) => m[1]))
  }
  return grouped
}

/** Re-runs the generator's scan, kept deliberately parallel to the Python. */
function scanImportGraph(): Map<string, string[]> {
  const components = readdirSync(COMPONENTS_DIR)
    .filter((entry) => statSync(path.join(COMPONENTS_DIR, entry)).isDirectory())
    .sort()
  const componentSet = new Set(components)
  const importRe = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g

  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    })

  const graph = new Map<string, string[]>()
  for (const comp of components) {
    const deps = new Set<string>()
    for (const file of walk(path.join(COMPONENTS_DIR, comp)).sort()) {
      if (!/\.tsx?$/.test(file) || file.includes('.test.')) continue
      for (const match of readFileSync(file, 'utf8').matchAll(importRe)) {
        const rel = path.relative(COMPONENTS_DIR, path.resolve(path.dirname(file), match[1]))
        const tcomp = rel.split(path.sep)[0]
        if (tcomp !== comp && componentSet.has(tcomp)) deps.add(tcomp)
      }
    }
    graph.set(comp, [...deps].sort())
  }
  return graph
}

describe('docs dependency graph data', () => {
  const nodes = readGenerated()

  it('parses a non-empty generated file', () => {
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('gives every docs route with a component directory a node', () => {
    const nodeIds = new Set(nodes.map((node) => node.id))
    const grouped = readGroupedMembers()
    for (const routePath of readRoutePaths()) {
      if (!routePath.startsWith('components/')) continue
      // A grouped page has no directory of its own; its members do.
      const dirs = grouped.get(routePath) ?? [routePath.slice('components/'.length)]
      for (const dir of dirs) {
        expect(nodeIds, `no graph node for ${routePath} (${dir})`).toContain(dir)
      }
    }
  })

  it('keeps every edge endpoint on an existing node, with no self-imports', () => {
    const nodeIds = new Set(nodes.map((node) => node.id))
    for (const node of nodes) {
      for (const dep of node.imports) {
        expect(nodeIds, `${node.id} imports unknown component ${dep}`).toContain(dep)
        expect(dep).not.toBe(node.id)
      }
    }
  })

  it('gives every node a unique position', () => {
    const positions = new Set<string>()
    for (const node of nodes) {
      const key = `${node.position.x}:${node.position.y}`
      expect(positions, `duplicate position ${key}`).not.toContain(key)
      positions.add(key)
    }
  })

  it('is in sync with the real import graph (re-run scripts/gen-docs-graph.py)', () => {
    const scanned = scanImportGraph()
    const generated = new Map(nodes.map((node) => [node.id, node.imports]))
    expect(Object.fromEntries(generated)).toEqual(Object.fromEntries(scanned))
  })
})
