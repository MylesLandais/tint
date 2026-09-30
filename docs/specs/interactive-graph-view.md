---
title: Interactive Graph View
document_id: APP-GRAPH-CLIENT-001
version: 2.0.0
status: as-built
owners:
  - tint-client
created: 2026-08-10
updated: 2026-09-30
target_runtime:
  client: Svelte 5 and TypeScript
  library: tint (Vite component library)
architecture:
  rendering: Svelte DOM nodes and native SVG edges
  state: controlled graph document with plain TypeScript commands
stability:
  client_contract: pre-1.0
---

# Interactive Graph View

## Purpose

`InteractiveGraphView` renders a host-owned `GraphDocument`, reports user intent,
and offers the next document. It does not fetch, persist, execute, or own the
document. `@nebula/tint/graph` is domain neutral; the Comfy workflow parser is an
optional pure TypeScript adapter.

## Source boundaries

| Path | Responsibility |
| --- | --- |
| `src/core/graph/` | Document and command contracts, `applyCommand`, node registry, form commands, projections, and Comfy parsing. This layer has no UI runtime. |
| `src/svelte/components/graph/` | Svelte SVG canvas, node and edge interaction, inspector, force projection, and timeline projection. |
| `src/docs/graph/` | Live examples and deterministic fixtures. |
| `src/components/graph/graph.css` | Compatibility stylesheet for existing `@nebula/tint/graph/styles.css` imports. The Svelte components carry their own scoped styles. |

The graph renderer uses native SVG paths for edges and positioned DOM nodes for
content. Hosts import `@nebula/tint/styles.css` for the semantic `--tint-*` tokens.

## Document and commands

`src/core/graph/document.ts` defines `GraphDocument`. The host replaces the
document after a change; its collections are readonly, and `revision` identifies
the current value. Node `configuration` remains `unknown` until a registered
node definition interprets it. Ports live on nodes, including bidirectional
ports, and document metadata belongs to the host.

`src/core/graph/commands.ts` defines the intent union. `applyCommand(document,
command, registry)` returns the next document for supported edits: moving,
resizing, creating, configuring, and deleting nodes; connecting edges; replacing
selection; and changing the viewport. The renderer calls `onCommand` before
reducing a command. If `onDocumentChange` is supplied, it offers the reduced
document through that callback. The host must pass the new `document` back for
an edit to persist. A host with its own store can consume `onCommand` and run
`applyCommand` itself.

| `InteractiveGraphView` prop | Contract |
| --- | --- |
| `document` | Required host-owned graph. |
| `registry` | Pure `GraphNodeRegistry`; defaults to `createDefaultGraphNodeRegistry()`. |
| `readonly` | Blocks edits while preserving selection and inspection. |
| `selection`, `onSelectionChange` | Optional controlled selection and selection intent. Controlled mode is chosen on first render; pass `emptySelection()` to clear it. |
| `validationByNodeId`, `runtimeByNodeId` | Host-supplied issues and execution status. The view does not run validation or execute nodes. |
| `viewport`, `onViewportChange` | Controlled camera input and camera intent, separate from an authored `document.viewport`. |
| `nodeRenderers`, `inspectorRenderers` | Svelte component maps for domain-specific node and inspector content. |
| `showInspector`, `showFullscreenControl`, `class` | Presentation controls. |
| `onCommand`, `onDocumentChange` | User intent and its reduced document. |

## Registry and forms

`GraphNodeDefinition` in `src/core/graph/registry.ts` supplies a kind, default
configuration, derived ports, validation, and an optional `formSchema`.
`applyCommand` uses `createDefault` and `derivePorts` for `node.create`.
Validation remains host initiated; the view renders supplied issues.

When a selected node has `formSchema`, `NodeInspector.svelte` shows
`NodeConfigurationForm.svelte`. Submit emits `node.configure`; the form does not
persist it independently. Domain-specific Svelte views can be passed through
`nodeRenderers` and `inspectorRenderers` without adding renderer types to core.

## Interaction and layout

The canvas supports pointer panning, wheel zoom, fit, node drag, native buttons
for ports, and node or edge selection. A drag commits one `node.move` when the
pointer releases. The root width is observed with `ResizeObserver` so a narrow
container stacks the inspector below the canvas. Fullscreen uses the browser API
when available and an in-page theater mode otherwise; Escape exits, focus is
contained in theater mode, and focus returns to the former control on exit.

Nodes and edges are keyboard targets. Arrow keys move a focused editable node;
Enter or Space selects an edge; Delete or Backspace removes an editable focused
entity. Port buttons provide a keyboard path to connect nodes. The canvas has a
named `role="application"` and a hidden keyboard description. Focus outlines and
status labels use semantic Tint tokens. Selection remains available in readonly
mode.

## Other projections

`src/core/graph/projections/` keeps layout math independent from rendering:

| Projection | Pure function | Svelte view |
| --- | --- | --- |
| Dependency | `topologicalLanes` | `InteractiveGraphView` |
| Network | `forceLayout`, `createForceLayout`, `stepForceLayout` | `ForceGraphView` |
| Schedule, trace, range | `projectTimeline` | `TimelineView` |

The views read the same `GraphDocument`. Timeline spans are a separate host-owned
overlay; the editable range variant reports `onSpanChange` because a span is not
part of `GraphDocument`.

## Verification

Core registry and reducer tests cover command behavior. Svelte graph tests cover
selection, keyboard and pointer intent, fullscreen behavior, and projection
rendering. The docs browser test opens the live graph and dependency graph
pages. `src/core/architecture.test.ts` prevents core from importing UI code,
and `src/exports.test.ts` checks the public Svelte entries.
