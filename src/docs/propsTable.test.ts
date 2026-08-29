import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Keeps the docs site's prop tables honest.
 *
 * The rows in each `<PropsTable>` are hand-written strings with nothing tying
 * them to the types they describe, so they drifted silently: `AudioInputProps`
 * grew `disabled` and `label`, `MediaPlayerVideoProps` grew `autoHideControls`,
 * and `TerminalConsoleProps` had five props no table mentioned. Adding a prop
 * without documenting it is now a failing test.
 *
 * Deliberately one-directional. A table may carry *extra* rows — inherited DOM
 * props like `className` are worth documenting even though they come from
 * `HTMLAttributes`, and a page may document a second component (MediaPlayer
 * documents SettingsPopout alongside it). Only undocumented props fail.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')

function read(relative: string) {
  return readFileSync(path.join(ROOT, relative), 'utf8')
}

function parse(relative: string) {
  return ts.createSourceFile(
    relative,
    read(relative),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
}

/** Every `type X = …` in a file, by name. */
function aliases(source: ts.SourceFile) {
  const found = new Map<string, ts.TypeAliasDeclaration>()
  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) found.set(node.name.text, node)
  })
  return found
}

/**
 * Property names a type declares itself.
 *
 * Follows intersections, unions, parenthesised types, and references to other
 * aliases in the same file. Does not follow `Omit<HTMLAttributes<…>, …>` and
 * friends — those contribute inherited DOM attributes, which the tables are not
 * required to enumerate.
 */
function declaredProps(
  typeName: string,
  source: ts.SourceFile,
  seen = new Set<string>(),
): Set<string> {
  const names = new Set<string>()
  const byName = aliases(source)
  const declaration = byName.get(typeName)
  if (!declaration || seen.has(typeName)) return names
  seen.add(typeName)

  const visit = (node: ts.TypeNode | undefined) => {
    if (!node) return
    if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          names.add(member.name.getText(source).replace(/^['"]|['"]$/g, ''))
        }
      }
      return
    }
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      node.types.forEach(visit)
      return
    }
    if (ts.isParenthesizedTypeNode(node)) {
      visit(node.type)
      return
    }
    if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
      const referenced = node.typeName.getText(source)
      if (byName.has(referenced)) {
        for (const name of declaredProps(referenced, source, seen)) names.add(name)
      }
    }
  }

  visit(declaration.type)
  return names
}

/** `name:` values in a doc file's PropsTable rows, splitting combined entries. */
function documentedProps(relative: string) {
  const names = new Set<string>()
  for (const match of read(relative).matchAll(/name:\s*'([^']+)'/g)) {
    for (const part of match[1]!.split('/')) names.add(part.trim())
  }
  return names
}

type Case = {
  doc: string
  types: string
  names: readonly string[]
}

const CASES: readonly Case[] = [
  {
    doc: 'src/docs/AudioInputDoc.tsx',
    types: 'src/components/audio-input/types.ts',
    names: ['AudioInputProps'],
  },
  {
    doc: 'src/docs/MediaPlayerDoc.tsx',
    types: 'src/components/media-player/MediaPlayer.tsx',
    names: ['MediaPlayerAudioProps', 'MediaPlayerVideoProps'],
  },
  {
    doc: 'src/docs/VideoPlayerDoc.tsx',
    types: 'src/components/video-player/VideoPlayer.tsx',
    names: ['VideoPlayerProps'],
  },
  {
    doc: 'src/docs/PanelDoc.tsx',
    types: 'src/components/panel/Panel.tsx',
    names: ['PanelProps'],
  },
  {
    doc: 'src/docs/SettingsPopoutDoc.tsx',
    types: 'src/components/settings-popout/SettingsPopout.tsx',
    names: ['SettingsPopoutProps'],
  },
  {
    doc: 'src/docs/terminal/TerminalDoc.tsx',
    types: 'src/components/terminal/types.ts',
    names: ['TerminalConsoleProps'],
  },
  {
    doc: 'src/docs/CodeDoc.tsx',
    types: 'src/components/code/CodeTabs.tsx',
    names: ['CodeTabsProps'],
  },
  {
    doc: 'src/docs/DiceDoc.tsx',
    types: 'src/components/dice/types.ts',
    names: ['DiceRollerProps'],
  },
  {
    doc: 'src/docs/graph/GraphDoc.tsx',
    types: 'src/components/graph/InteractiveGraphView.tsx',
    names: ['InteractiveGraphViewProps'],
  },
  {
    doc: 'src/docs/telemetry/TelemetryDoc.tsx',
    types: 'src/components/telemetry/types.ts',
    names: [
      'TraceWaterfallProps',
      'TraceMetricsProps',
      'TraceSpanDetailProps',
      'TraceViewerProps',
      'TraceServiceMapProps',
    ],
  },
  {
    doc: 'src/docs/form/FormDoc.tsx',
    types: 'src/components/form/FormLayout.tsx',
    names: ['FormLayoutProps'],
  },
  {
    doc: 'src/docs/character-card/CharacterCardDoc.tsx',
    types: 'src/components/character-card/CharacterCardEditorForm.tsx',
    names: ['CharacterCardEditorFormProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/FeedLayout.tsx',
    names: ['FeedLayoutProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/SplitPane.tsx',
    names: ['SplitPaneProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/ReaderPane.tsx',
    names: ['ReaderPaneProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/NarrationTransport.tsx',
    names: ['NarrationTransportProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/SourceHealthBadge.tsx',
    names: ['SourceHealthBadgeProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/ViewModeToggle.tsx',
    names: ['ViewModeToggleProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/HighlightLayer.tsx',
    names: ['HighlightLayerProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/SelectionToolbar.tsx',
    names: ['SelectionToolbarProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/FeedEntryCard.tsx',
    names: ['FeedEntryCardProps'],
  },
  {
    doc: 'src/docs/feed/FeedDoc.tsx',
    types: 'src/components/feed/FeedEntryRow.tsx',
    names: ['FeedEntryRowProps'],
  },
  {
    doc: 'src/docs/calendar/CalendarDoc.tsx',
    types: 'src/components/calendar/CalendarMonthView.tsx',
    names: ['CalendarMonthViewProps'],
  },
  {
    doc: 'src/docs/calendar/CalendarDoc.tsx',
    types: 'src/components/calendar/CalendarToolbar.tsx',
    names: ['CalendarToolbarProps'],
  },
  {
    doc: 'src/docs/ScrollingLabelDoc.tsx',
    types: 'src/components/scrolling-label/ScrollingLabel.tsx',
    names: ['ScrollingLabelProps'],
  },
  {
    doc: 'src/docs/board/BoardDoc.tsx',
    types: 'src/components/board/BoardLayout.tsx',
    names: ['BoardLayoutProps'],
  },
  {
    doc: 'src/docs/board/BoardDoc.tsx',
    types: 'src/components/board/BoardCard.tsx',
    names: ['BoardCardProps'],
  },
  {
    doc: 'src/docs/board/BoardDoc.tsx',
    types: 'src/components/board/BoardDetail.tsx',
    names: ['BoardDetailProps'],
  },
  {
    doc: 'src/docs/board/BoardDoc.tsx',
    types: 'src/components/board/BoardLayoutToggle.tsx',
    names: ['BoardLayoutToggleProps'],
  },
  {
    doc: 'src/docs/activity/ActivityDoc.tsx',
    types: 'src/components/activity/ActivityFeed.tsx',
    names: ['ActivityFeedProps'],
  },
  {
    doc: 'src/docs/activity/ActivityDoc.tsx',
    types: 'src/components/activity/ActivityFeedRow.tsx',
    names: ['ActivityFeedRowProps'],
  },
  {
    doc: 'src/docs/policy/PolicyDoc.tsx',
    types: 'src/components/policy/PolicyTable.tsx',
    names: ['PolicyTableProps'],
  },
  {
    doc: 'src/docs/policy/PolicyDoc.tsx',
    types: 'src/components/policy/PolicyEditor.tsx',
    names: ['PolicyEditorProps'],
  },
  {
    doc: 'src/docs/policy/PolicyDoc.tsx',
    types: 'src/components/policy/PolicyDryRun.tsx',
    names: ['PolicyDryRunProps'],
  },
  {
    doc: 'src/docs/notify/NotifyDoc.tsx',
    types: 'src/components/notify/NotificationBell.tsx',
    names: ['NotificationBellProps'],
  },
  {
    doc: 'src/docs/notify/NotifyDoc.tsx',
    types: 'src/components/notify/NotificationList.tsx',
    names: ['NotificationListProps'],
  },
  {
    doc: 'src/docs/notify/NotifyDoc.tsx',
    types: 'src/components/notify/NotificationSettings.tsx',
    names: ['NotificationSettingsProps'],
  },
]

describe('docs prop tables', () => {
  it.each(CASES.map((entry) => [entry.doc, entry] as const))(
    '%s documents every prop its component declares',
    (_label, entry) => {
      const source = parse(entry.types)
      const declared = new Set(
        entry.names.flatMap((name) => [...declaredProps(name, source)]),
      )
      // A type that resolves to nothing means the parser lost the declaration,
      // which would make this assertion vacuously pass.
      expect(declared.size).toBeGreaterThan(0)

      const documented = documentedProps(entry.doc)
      const undocumented = [...declared].filter((name) => !documented.has(name)).sort()
      expect(undocumented).toEqual([])
    },
  )
})
