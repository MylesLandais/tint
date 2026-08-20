import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  DEMO_FEED,
  FeedLayout,
  NarrationTransport,
  ReaderPane,
  SourceHealthBadge,
  SplitPane,
  ViewModeToggle,
  channelPath,
  entriesForChannel,
  resolveAttribution,
  type FeedEntry,
  type FeedLayoutVariant,
} from '../../components/feed'
import { Dialog } from '../../components/dialog'
import { Button } from '../../components/button'
import { ToastProvider, useToast } from '../../components/toast'
import { TreeView, type TreeNode } from '../../components/tree'
import { Badge } from '../../components/badge'
import { InteractiveGraphView } from '../../components/graph'
import '../../components/graph/graph.css'
import { MAYA_TTS_SRC } from '../chat/demo/scenarios'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import { getDemoFeedStore, subscribeDemoFeedStore } from './demoStore'
import { channelTopologyDocument, createChannelNodeRegistry } from './channelGraph'

const usage = `import {
  FeedLayout,
  SplitPane,
  ReaderPane,
  ViewModeToggle,
  NarrationTransport,
  SourceHealthBadge,
  channelPath,
  resolveAttribution,
} from 'tint/feed'`

type FilterId = 'all' | 'new' | 'unread' | 'matched'

type Scope =
  | { kind: 'channel'; channelId: string }
  | { kind: 'source'; sourceId: string }

function filterEntries(
  entries: readonly FeedEntry[],
  filter: FilterId,
  matchedIds: ReadonlySet<string>,
): FeedEntry[] {
  switch (filter) {
    case 'unread':
      return entries.filter((entry) => entry.readState === 'unread')
    case 'matched':
      return entries.filter((entry) => matchedIds.has(entry.id))
    case 'new':
      return [...entries].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 5)
    default:
      return [...entries]
  }
}

function Workbench() {
  const { feed } = useSyncExternalStore(subscribeDemoFeedStore, getDemoFeedStore, getDemoFeedStore)
  const { push } = useToast()
  const [variant, setVariant] = useState<FeedLayoutVariant>('feed')
  const [filter, setFilter] = useState<FilterId>('all')
  const [scope, setScope] = useState<Scope>({
    kind: 'channel',
    channelId: feed.channels[0]?.id ?? 'ch-misskatie',
  })
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(feed.entries[0]?.id ?? null)
  const [startWidth, setStartWidth] = useState('16rem')
  const [middleWidth, setMiddleWidth] = useState('1fr')
  const [askOpen, setAskOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>(() => feed.channels.map((c) => c.id))

  const channelRegistry = useMemo(() => createChannelNodeRegistry(), [])

  const matchedIds = useMemo(
    () => new Set(feed.matches.map((match) => match.entryId)),
    [feed.matches],
  )

  const sourceLabels = useMemo(
    () =>
      Object.fromEntries(
        feed.sources.map((source) => [source.id, resolveAttribution(feed, source.id)]),
      ),
    [feed],
  )

  const tree: TreeNode[] = useMemo(
    () =>
      feed.channels.map((channel) => {
        const children = feed.sources.filter((source) => source.channelId === channel.id)
        const unreadSum = children.reduce((sum, source) => sum + source.unreadCount, 0)
        return {
          id: channel.id,
          label: (
            <span className="inline-flex flex-col">
              <span>{channel.name}</span>
              <span className="text-[0.65rem] text-tint-muted">{channelPath(channel)}</span>
            </span>
          ),
          trailing: unreadSum > 0 ? <Badge tone="accent">{unreadSum}</Badge> : null,
          children: children.map((source) => ({
            id: source.id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <Badge tone="neutral">{source.platform}</Badge>
                <span>{source.handle}</span>
              </span>
            ),
            trailing: (
              <span className="inline-flex items-center gap-1">
                {source.unreadCount > 0 ? (
                  <Badge tone="accent">{source.unreadCount}</Badge>
                ) : null}
                <SourceHealthBadge health={source.health} />
              </span>
            ),
          })),
        }
      }),
    [feed.channels, feed.sources],
  )

  const selectedChannelId =
    scope.kind === 'channel'
      ? scope.channelId
      : feed.sources.find((source) => source.id === scope.sourceId)?.channelId

  const scoped =
    scope.kind === 'source'
      ? feed.entries.filter((entry) => entry.sourceId === scope.sourceId)
      : entriesForChannel(feed, scope.channelId)

  const visible = filterEntries(scoped, filter, matchedIds)
  const selected = feed.entries.find((entry) => entry.id === selectedEntryId) ?? visible[0]

  const topology = selectedChannelId ? channelTopologyDocument(feed, selectedChannelId) : null

  const selectedTreeIds = scope.kind === 'source' ? [scope.sourceId] : [scope.channelId]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const match = DEMO_FEED.matches[0]
      if (!match) return
      const entry = DEMO_FEED.entries.find((item) => item.id === match.entryId)
      push({
        title: 'New policy match',
        description: entry?.title ?? match.entryId,
        tone: 'info',
      })
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [push])

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ViewModeToggle value={variant} onChange={setVariant} />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Entry filter">
          {(['all', 'new', 'unread', 'matched'] as const).map((id) => (
            <Button
              key={id}
              size="sm"
              variant={filter === id ? 'primary' : 'ghost'}
              onClick={() => setFilter(id)}
            >
              {id}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setAskOpen(true)}>
          Ask Maya
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            window.location.hash = '#/components/chat?scenario=subscriptions'
          }}
        >
          Open channel chat
        </Button>
      </div>

      <SplitPane
        className="h-[36rem] rounded-xl border border-tint-border"
        startWidth={startWidth}
        middleWidth={middleWidth}
        endWidth="22rem"
        onStartWidthChange={(px) => setStartWidth(`${px}px`)}
        onMiddleWidthChange={(px) => setMiddleWidth(`${px}px`)}
        start={
          <TreeView
            className="p-2"
            nodes={tree}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            selectedIds={selectedTreeIds}
            onSelectedChange={(ids) => {
              const id = ids[0]
              if (!id) return
              if (feed.channels.some((channel) => channel.id === id)) {
                setScope({ kind: 'channel', channelId: id })
                return
              }
              setScope({ kind: 'source', sourceId: id })
            }}
          />
        }
        middle={
          <div className="flex h-full flex-col gap-3 overflow-auto p-3">
            <FeedLayout
              entries={visible}
              variant={variant}
              sourceLabels={sourceLabels}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedEntryId}
            />
            {topology ? (
              <div>
                <h3 className="mt-0 mb-1 text-sm font-semibold text-tint-ink">
                  Channel topology ·{' '}
                  {feed.channels.find((channel) => channel.id === selectedChannelId)?.name}
                </h3>
                <p className="mt-0 mb-2 text-xs text-tint-muted">
                  Mock room → inbound streams. Selecting a stream scopes the list; workflow graphs
                  live on the Policy page.
                </p>
                <div className="h-[14rem] overflow-hidden rounded-xl border border-tint-border">
                  <InteractiveGraphView
                    document={topology}
                    registry={channelRegistry}
                    readonly
                    showInspector={false}
                  />
                </div>
              </div>
            ) : null}
          </div>
        }
        end={
          selected ? (
            <ReaderPane
              className="h-full rounded-none border-0"
              header={
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="m-0 text-base font-semibold text-tint-ink">{selected.title}</h3>
                    <p className="m-0 mt-1 text-xs text-tint-muted">
                      {sourceLabels[selected.sourceId] ?? selected.sourceId}
                    </p>
                  </div>
                  <NarrationTransport src={MAYA_TTS_SRC} label="Cached narration" />
                </div>
              }
            >
              <p className="m-0 whitespace-pre-wrap">{selected.body ?? selected.excerpt}</p>
            </ReaderPane>
          ) : (
            <p className="p-4 text-sm text-tint-muted">Select an entry.</p>
          )
        }
      />

      <Dialog
        open={askOpen}
        onOpenChange={setAskOpen}
        title="Ask Maya to subscribe"
        description="Opens the Chat Subscriptions scenario — Maya confirms before writing Channel + Source + Policy."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setAskOpen(false)
              window.location.hash = '#/components/chat?scenario=subscriptions'
            }}
          >
            Open chat scenario
          </Button>
        }
      >
        <p className="m-0 text-sm text-tint-muted">
          Example: “subscribe to misskatie, notify, cache on release” or “watch domain for token,
          use k2s-unlock”. All data here is mock fixture — nothing is fetched.
        </p>
      </Dialog>
    </>
  )
}

export function FeedDoc() {
  return (
    <ToastProvider>
      <DocsPage
        route="components/feed"
        title="Feed"
        intro="Subscriptions workbench: channel rooms with inbound platform streams, layout variants, and a reader pane. Host owns FeedDocument; Tint presents it."
        note="Channels are routeable rooms (channel/misskatie, channel/gaming). Sources are mock streams — no live crawl. Demo toast fires once for a fixture policy match."
      >
        <DocsSection id="preview" title="Workbench">
          <DocsPreview className="p-3 sm:p-4">
            <Workbench />
          </DocsPreview>
        </DocsSection>

        <DocsSection id="usage" title="Usage">
          <CodeBlock code={usage} />
        </DocsSection>

        <DocsSection id="api" title="API">
          <PropsTable
            rows={[
              {
                name: 'entries',
                type: 'readonly FeedEntry[]',
                required: true,
                description: 'Host-owned feed rows for FeedLayout.',
              },
              {
                name: 'variant',
                type: 'FeedLayoutVariant',
                description: 'wall | list | magazine | ticker | carousel | feed.',
              },
              {
                name: 'sourceLabels',
                type: 'Record<string, string>',
                description: 'sourceId → attribution (prefer resolveAttribution).',
              },
              {
                name: 'selectedId',
                type: 'string | null',
                description: 'Controlled selection for card/row highlight.',
              },
              {
                name: 'onSelect',
                type: '(entryId: string) => void',
                description: 'Selection intent; host updates selectedId.',
              },
              {
                name: 'renderActions',
                type: '(entry: FeedEntry) => ReactNode',
                description: 'Optional trailing actions per entry.',
              },
              {
                name: 'empty',
                type: 'ReactNode',
                description: 'Empty-state content when entries is empty.',
              },
              {
                name: 'start/middle/end',
                type: 'ReactNode',
                description: 'SplitPane columns; end is optional for two-column shells.',
              },
              {
                name: 'startWidth/middleWidth/endWidth',
                type: 'string',
                description: 'Host-owned CSS widths; drag reports pixels via callbacks.',
              },
              {
                name: 'onStartWidthChange/onMiddleWidthChange',
                type: '(widthPx: number) => void',
                description: 'Resize callbacks; host sets width props.',
              },
              {
                name: 'minPanePx',
                type: 'number',
                description: 'Minimum pane width while dragging.',
              },
              {
                name: 'header/highlightLayer/children',
                type: 'ReactNode',
                description: 'ReaderPane sticky header, highlight slot, and article body.',
              },
              {
                name: 'src',
                type: 'string',
                required: true,
                description: 'NarrationTransport host-owned audio URL.',
              },
              {
                name: 'label/rates/onEnded',
                type: 'string | number[] | () => void',
                description: 'NarrationTransport chrome and speed options.',
              },
              {
                name: 'health',
                type: 'SourceHealth',
                required: true,
                description: 'SourceHealthBadge crawl state.',
              },
              {
                name: 'value/onChange/options',
                type: 'FeedLayoutVariant',
                description: 'ViewModeToggle controlled variant picker.',
              },
              {
                name: 'text/highlights/activeId/onHighlightClick',
                type: 'string | TextHighlight[]',
                description: 'HighlightLayer precomputed spans over plain text.',
              },
              {
                name: 'position/open/actions/onAction',
                type: 'SelectionToolbar props',
                description: 'Floating selection actions; host measures position.',
              },
              {
                name: 'entry/sourceLabel/selected/onSelect/actions',
                type: 'FeedEntryCard / FeedEntryRow',
                description: 'Card and row presentational props.',
              },
              { name: 'className', type: 'string', description: 'Appended to the root element.' },
              { name: 'disabled', type: 'boolean', description: 'Disables ViewModeToggle controls.' },
            ]}
          />
        </DocsSection>
      </DocsPage>
    </ToastProvider>
  )
}
