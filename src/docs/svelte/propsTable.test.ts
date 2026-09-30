import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Guard the hand-written Svelte API rows against changes in declared props.
 * As in the former React docs check, inherited HTML and ComponentProps fields
 * are outside the scope of this syntax-only check.
 */
const ROOT = path.resolve(import.meta.dirname, '../../..')

type Case = { doc: string; source: string; names: readonly string[] }
const cases: readonly Case[] = [
  { doc: 'AudioInputDoc.svelte', source: 'audio-input/AudioInput.svelte', names: ['Props'] },
  { doc: 'MediaDoc.svelte', source: 'media/playerTypes.ts', names: ['MediaPlayerAudioProps', 'MediaPlayerVideoProps'] },
  { doc: 'MediaDoc.svelte', source: 'media/PlaybackQueue.svelte', names: ['Props'] },
  { doc: 'MediaDoc.svelte', source: 'media/VideoPlayer.svelte', names: ['Props'] },
  { doc: 'MediaDoc.svelte', source: 'media/SettingsPopout.svelte', names: ['Props'] },
  { doc: 'PanelDoc.svelte', source: 'panel/Panel.svelte', names: ['Props'] },
  { doc: 'terminal/TerminalDoc.svelte', source: 'terminal/types.ts', names: ['TerminalConsoleProps'] },
  { doc: 'CodeDoc.svelte', source: 'code/CodeTabs.svelte', names: ['Props'] },
  { doc: 'DiceDoc.svelte', source: 'dice/DiceRoller.svelte', names: ['Props'] },
  { doc: 'graph/GraphDoc.svelte', source: 'graph/types.ts', names: ['InteractiveGraphViewProps', 'ForceGraphViewProps', 'TimelineViewProps'] },
  { doc: 'TelemetryDoc.svelte', source: 'telemetry/types.ts', names: ['TraceWaterfallProps', 'TraceMetricsProps', 'TraceSpanDetailProps', 'TraceViewerProps', 'TraceServiceMapProps'] },
  { doc: 'form/FormDoc.svelte', source: '../form/FormLayout.svelte', names: ['Props'] },
  { doc: 'character-card/CharacterCardDoc.svelte', source: 'character-card/CharacterCardEditorForm.svelte', names: ['Props'] },
  { doc: 'FeedDoc.svelte', source: 'feed/types.ts', names: ['FeedEntryCardProps', 'FeedEntryRowProps', 'FeedLayoutProps', 'HighlightLayerProps', 'NarrationTransportProps', 'ReaderPaneProps', 'SelectionToolbarProps', 'SourceHealthBadgeProps', 'SplitPaneProps', 'ViewModeToggleProps'] },
  { doc: 'CalendarDoc.svelte', source: 'calendar/types.ts', names: ['CalendarMonthViewProps', 'CalendarToolbarProps'] },
  { doc: 'ScrollingLabelDoc.svelte', source: 'scrolling-label/ScrollingLabel.svelte', names: ['Props'] },
  { doc: 'BoardDoc.svelte', source: 'board/types.ts', names: ['BoardCardProps', 'BoardDetailProps', 'BoardLayoutProps', 'BoardLayoutToggleProps'] },
  { doc: 'ActivityDoc.svelte', source: 'activity/types.ts', names: ['ActivityFeedProps', 'ActivityFeedRowProps'] },
  { doc: 'policy/PolicyDoc.svelte', source: 'policy/types.ts', names: ['PolicyEditorProps', 'PolicyDryRunProps', 'PolicyTableProps'] },
  { doc: 'NotifyDoc.svelte', source: 'notify/types.ts', names: ['NotificationBellProps', 'NotificationListProps', 'NotificationSettingsProps'] },
  { doc: 'IdentityDoc.svelte', source: 'identity/types.ts', names: ['AvatarProps', 'AvatarGroupProps'] },
  { doc: 'SurfaceDoc.svelte', source: 'surface/Surface.svelte', names: ['Props'] },
  { doc: 'SurfaceDoc.svelte', source: 'surface/Card.svelte', names: ['Props'] },
  { doc: 'StatusDoc.svelte', source: 'status/Skeleton.svelte', names: ['Props'] },
  { doc: 'StatusDoc.svelte', source: 'status/EmptyState.svelte', names: ['Props'] },
  { doc: 'StatusDoc.svelte', source: 'status/ErrorState.svelte', names: ['Props'] },
  { doc: 'StatusDoc.svelte', source: 'status/ConnectionStatus.svelte', names: ['Props'] },
  { doc: 'NavigationDoc.svelte', source: 'navigation/types.ts', names: ['NavigationListProps', 'BreadcrumbsProps', 'AppShellProps'] },
  { doc: 'MenuDoc.svelte', source: 'menu/Menu.svelte', names: ['Props'] },
  { doc: 'PopoverDoc.svelte', source: 'popover/Popover.svelte', names: ['Props'] },
  { doc: 'TabsDoc.svelte', source: 'tabs/Tabs.svelte', names: ['Props'] },
  { doc: 'MediaAssetsDoc.svelte', source: 'media-assets/GalleryGrid.svelte', names: ['Props'] },
  { doc: 'MediaAssetsDoc.svelte', source: 'media-assets/MediaLightbox.svelte', names: ['Props'] },
  { doc: 'MediaAssetsDoc.svelte', source: 'media-assets/UploadDropzone.svelte', names: ['Props'] },
  { doc: 'MediaAssetsDoc.svelte', source: 'media-assets/UploadQueue.svelte', names: ['Props'] },
  { doc: 'ChartsDoc.svelte', source: 'charts/types.ts', names: ['ChartProps', 'MetricCardProps'] },
  { doc: 'WorkspaceDoc.svelte', source: 'table/WorkspaceGrid.svelte', names: ['Props'] },
]

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), 'utf8')
}

function parseSource(relative: string): ts.SourceFile {
  const text = read(relative)
  const script = relative.endsWith('.svelte')
    ? text.match(/<script\s+lang=["']ts["']>([\s\S]*?)<\/script>/)?.[1]
    : text
  if (script === undefined) throw new Error(`Missing TypeScript script: ${relative}`)
  return ts.createSourceFile(relative, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function declaredProps(source: ts.SourceFile, name: string, seen = new Set<string>()): Set<string> {
  const aliases = new Map<string, ts.TypeAliasDeclaration | ts.InterfaceDeclaration>()
  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) aliases.set(node.name.text, node)
  })
  const declaration = aliases.get(name)
  if (!declaration || seen.has(name)) return new Set()
  seen.add(name)
  const names = new Set<string>()
  const visit = (node: ts.TypeNode | undefined): void => {
    if (!node) return
    if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          names.add(member.name.getText(source).replace(/^["']|["']$/g, ''))
        }
      }
    } else if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) node.types.forEach(visit)
    else if (ts.isParenthesizedTypeNode(node)) visit(node.type)
    else if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
      for (const prop of declaredProps(source, node.typeName.getText(source), seen)) names.add(prop)
    }
  }
  if (ts.isTypeAliasDeclaration(declaration)) visit(declaration.type)
  else for (const member of declaration.members) {
    if (ts.isPropertySignature(member) && member.name) names.add(member.name.getText(source).replace(/^["']|["']$/g, ''))
  }
  return names
}

function documentedProps(relative: string): Set<string> {
  const names = new Set<string>()
  for (const row of read(relative).matchAll(/\bprop:\s*'([^']+)'/g)) {
    for (const part of row[1]!.split('/')) {
      const last = part.trim().match(/([A-Za-z_$][\w$]*)$/)?.[1]
      if (last) names.add(last)
    }
  }
  return names
}

describe('Svelte docs API rows', () => {
  it('documents declared component props', () => {
    const missing: string[] = []
    let declaredCount = 0
    for (const entry of cases) {
      const doc = `src/docs/${entry.doc}`
      const source = `src/svelte/components/${entry.source}`
      const parsed = parseSource(source)
      const declared = new Set(entry.names.flatMap((name) => [...declaredProps(parsed, name)]))
      expect(declared.size, `${source}: parser found no declared props`).toBeGreaterThan(0)
      declaredCount += declared.size
      const documented = documentedProps(doc)
      for (const prop of declared) if (!documented.has(prop)) missing.push(`${entry.doc}: ${entry.source} -> ${prop}`)
    }
    expect(missing, `${missing.length} of ${declaredCount} declared props lack an API row`).toEqual([])
  })
})
