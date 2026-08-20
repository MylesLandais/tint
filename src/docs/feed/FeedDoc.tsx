import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  DEMO_FEED,
  FeedLayout,
  NarrationTransport,
  ReaderPane,
  SourceHealthBadge,
  SplitPane,
  ViewModeToggle,
  type FeedEntry,
  type FeedLayoutVariant,
} from '../../components/feed'
import { Dialog } from '../../components/dialog'
import { Button } from '../../components/button'
import { ToastProvider, useToast } from '../../components/toast'
import { TreeView, type TreeNode } from '../../components/tree'
import { Badge } from '../../components/badge'
import { MAYA_TTS_SRC } from '../chat/demo/scenarios'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import {
  getDemoFeedStore,
  subscribeDemoFeedStore,
} from './demoStore'

const usage = `import {
  FeedLayout,
  SplitPane,
  ReaderPane,
  ViewModeToggle,
  NarrationTransport,
  SourceHealthBadge,
} from 'tint/feed'`

type FilterId = 'all' | 'new' | 'unread' | 'matched'

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
      return [...entries].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 3)
    default:
      return [...entries]
  }
}

function Workbench() {
  const { feed } = useSyncExternalStore(subscribeDemoFeedStore, getDemoFeedStore, getDemoFeedStore)
  const { push } = useToast()
  const [variant, setVariant] = useState<FeedLayoutVariant>('feed')
  const [filter, setFilter] = useState<FilterId>('all')
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(feed.sources[0]?.id ?? null)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(feed.entries[0]?.id ?? null)
  const [startWidth, setStartWidth] = useState('14rem')
  const [middleWidth, setMiddleWidth] = useState('1fr')
  const [askOpen, setAskOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>(['sources'])

  const matchedIds = useMemo(
    () => new Set(feed.matches.map((match) => match.entryId)),
    [feed.matches],
  )

  const sourceLabels = useMemo(
    () => Object.fromEntries(feed.sources.map((source) => [source.id, source.handle])),
    [feed.sources],
  )

  const tree: TreeNode[] = useMemo(
    () => [
      {
        id: 'sources',
        label: 'Sources',
        children: feed.sources.map((source) => ({
          id: source.id,
          label: source.handle,
          trailing: (
            <span className="inline-flex items-center gap-1">
              {source.unreadCount > 0 ? (
                <Badge tone="accent">{source.unreadCount}</Badge>
              ) : null}
              <SourceHealthBadge health={source.health} />
            </span>
          ),
        })),
      },
    ],
    [feed.sources],
  )

  const scoped = selectedSourceId
    ? feed.entries.filter((entry) => entry.sourceId === selectedSourceId)
    : feed.entries
  const visible = filterEntries(scoped, filter, matchedIds)
  const selected = feed.entries.find((entry) => entry.id === selectedEntryId) ?? visible[0]

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
            selectedIds={selectedSourceId ? [selectedSourceId] : []}
            onSelectedChange={(ids) => setSelectedSourceId(ids[0] ?? null)}
          />
        }
        middle={
          <div className="p-3">
            <FeedLayout
              entries={visible}
              variant={variant}
              sourceLabels={sourceLabels}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedEntryId}
            />
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
        description="Opens the Chat Subscriptions scenario — Maya confirms before writing Source + Policy."
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
          use k2s-unlock”.
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
        intro="Subscriptions workbench: sources tree, layout variants, and a reader pane. Host owns FeedDocument; Tint presents it."
        note="Demo toast fires once after a few seconds for a fixture policy match. Narration uses the cached Maya clip — no live TTS."
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
                type: "FeedLayoutVariant",
                description: 'wall | list | magazine | ticker | carousel | feed.',
              },
              {
                name: 'sourceLabels',
                type: 'Record<string, string>',
                description: 'sourceId → handle for attribution lines.',
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
