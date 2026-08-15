import { useCallback, useMemo, useRef } from 'react'
// The graph ships its stylesheet as `tint/graph/styles.css`, like auth. Hosts
// import it themselves; the component does not pull it in.
import '../components/graph/graph.css'
import {
  InteractiveGraphView,
  type GraphDocument,
  type GraphSelection,
} from '../components/graph'
import { CodeBlock } from './components/CodeBlock'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from './components/DocsPage'
import { docsGraphNodes } from './generated/docsGraph'
import { DOC_ROUTES } from './routes'

const usageCode = `# Regenerate after changing cross-component imports:
python3 scripts/gen-docs-graph.py

# The output is committed as data at
# src/docs/generated/docsGraph.ts — one entry per component directory:
{ id: "media-player", imports: ["icon", "media", "video-player"], position: { x: 1020, y: -75 } }`

const previewCode = `// The same InteractiveGraphView the Graph component ships,
// fed with the generated import graph — readonly, no inspector.
<InteractiveGraphView
  document={dependencyGraphDocument}
  readonly
  showInspector={false}
  onSelectionChange={navigateToComponent}
/>`

/** Docs route label for a component directory, falling back to the directory name. */
function labelFor(dir: string): string {
  const route = DOC_ROUTES.find((r) => r.path === `components/${dir}`)
  return route?.label ?? dir
}

/**
 * Build the graph document from the generated adjacency data: one `action`
 * node per component directory, one edge per cross-component import.
 */
function buildDependencyDocument(): GraphDocument {
  return {
    schemaVersion: '0.1.0',
    id: 'graph:docs:component-dependencies',
    revision: 'r1',
    viewport: { x: 80, y: 260, zoom: 0.75 },
    metadata: {
      title: 'tint component dependency graph',
      purpose: 'Generated from the real import graph by scripts/gen-docs-graph.py',
    },
    groups: [],
    nodes: docsGraphNodes.map((node) => ({
      id: node.id,
      kind: 'action',
      position: node.position,
      presentation: {
        label: labelFor(node.id),
        description:
          node.imports.length > 0
            ? `Builds on ${node.imports.map(labelFor).join(', ')}.`
            : 'No cross-component imports.',
      },
      configuration: { action: 'docs.component' },
      ports: [
        { id: 'in:input', key: 'in', direction: 'input' as const, cardinality: 'multiple' as const },
        { id: 'out:output', key: 'out', direction: 'output' as const, cardinality: 'multiple' as const },
      ],
      capabilities: { movable: false, connectable: false, deletable: false },
    })),
    edges: docsGraphNodes.flatMap((node) =>
      node.imports.map((dep) => ({
        id: `e-${node.id}-${dep}`,
        // An import edge points at what the component builds on.
        source: { nodeId: node.id, portId: 'out:output' },
        target: { nodeId: dep, portId: 'in:input' },
        kind: 'control',
      })),
    ),
  }
}

export function ComponentGraphDoc() {
  const document = useMemo(() => buildDependencyDocument(), [])
  const lastNavigatedRef = useRef<string | null>(null)

  // Quartz-style click-to-navigate: a single-node click selection jumps to
  // that component's page. Box-select (more than one node) and clearing the
  // selection (zero nodes) never navigate, and re-selecting the same node —
  // e.g. the selection event that fires after arriving back — is ignored.
  const onSelectionChange = useCallback((selection: GraphSelection) => {
    if (selection.nodeIds.size !== 1) {
      lastNavigatedRef.current = null
      return
    }
    const [nodeId] = selection.nodeIds
    if (nodeId === lastNavigatedRef.current) return
    lastNavigatedRef.current = nodeId
    window.location.hash = `#/components/${nodeId}`
  }, [])

  return (
    <DocsPage
      route="graph"
      title="Dependency Graph"
      intro="Every tint component and what it builds on — derived from the real import graph. Click a node to open that component's page."
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="The library's own InteractiveGraphView, rendered readonly over the generated adjacency data — no physics pass, positions come from the generator."
      >
        <DocsDemo code={previewCode}>
          <InteractiveGraphView
            document={document}
            readonly
            showInspector={false}
            onSelectionChange={onSelectionChange}
          />
        </DocsDemo>
        <DocsCallout variant="note" title="Generated from real imports">
          This graph is not a hand-drawn diagram.{' '}
          <code>scripts/gen-docs-graph.py</code> scans{' '}
          <code>src/components</code> for cross-component imports and commits the
          result as data, so the picture above is exactly what the codebase
          looks like today — when imports change, the graph goes stale until the
          script is re-run.
        </DocsCallout>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description="The generator is deterministic: sorted inputs, a layered grid for positions, no timestamps. Re-running it on an unchanged tree produces a byte-identical file."
      >
        <CodeBlock code={usageCode} language="bash" />
      </DocsSection>

      <DocsFooter>
        <span>
          {docsGraphNodes.length} components ·{' '}
          {docsGraphNodes.reduce((n, node) => n + node.imports.length, 0)} import edges
        </span>
      </DocsFooter>
    </DocsPage>
  )
}
