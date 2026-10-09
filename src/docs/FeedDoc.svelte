<script lang="ts">
  import { FeedLayout, ReaderPane, SourceHealthBadge, ViewModeToggle, type FeedEntry, type FeedLayoutVariant } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const entries: FeedEntry[] = [
    { id: 'first', sourceId: 'updates', title: 'Night Drive mix is ready', url: '#night-drive', publishedAt: '2026-09-30T10:00:00Z', excerpt: 'A new mix and track notes are available for review.', body: 'The Night Drive mix is ready. Listen through the transition into the closing track and share your notes.', tags: ['music', 'mix'], readState: 'unread', contentKind: 'article', artifactStatus: 'ready' },
    { id: 'second', sourceId: 'updates', title: 'October release schedule', url: '#october', publishedAt: '2026-09-29T14:00:00Z', excerpt: 'Five releases are planned for next month.', body: 'The October schedule includes five releases. Review the dates before publishing the calendar.', tags: ['release'], readState: 'read', contentKind: 'article' },
    { id: 'third', sourceId: 'forum', title: 'Production notes from the forum', url: '#notes', publishedAt: '2026-09-28T08:00:00Z', excerpt: 'The community shared feedback on the latest arrangement.', body: 'Forum members suggested a shorter intro and a clearer vocal entrance.', tags: ['discussion'], readState: 'read', contentKind: 'thread' },
  ]
  let variant = $state<FeedLayoutVariant>('feed')
  let selectedId = $state<string | null>('first')
  let selectedEntry = $derived(entries.find((entry) => entry.id === selectedId))
  const api: ApiRow[] = [
    { prop: 'entries / variant', type: 'FeedEntry[] / FeedLayoutVariant', description: 'Host-owned entries and responsive feed, list, ticker, magazine, carousel, or wall layout.' },
    { prop: 'selectedId / onSelect', type: 'string | null / (id) => void', description: 'Controlled entry selection; the host updates its own document.' },
    { prop: 'renderActions / sourceLabels', type: 'Snippet / Record<string, string>', description: 'Optional entry actions and readable source attribution.' },
    { prop: 'ReaderPane header / children', type: 'string | Snippet / Snippet', description: 'Scrollable article reading surface.' },
    { prop: 'ViewModeToggle value / onChange', type: 'FeedLayoutVariant / callback', description: 'Controlled layout choice with pressed state.' },
    { prop: 'FeedEntryCard / FeedEntryRow entry', type: 'FeedEntry', description: 'The entry rendered by a standalone card or row.' },
    { prop: 'FeedEntryCard / FeedEntryRow sourceLabel', type: 'string', description: 'Readable source name shown beside the published time.' },
    { prop: 'FeedEntryCard / FeedEntryRow selected', type: 'boolean', description: 'Host-owned selected state for a standalone entry view.' },
    { prop: 'FeedEntryCard / FeedEntryRow actions', type: 'Snippet', description: 'Optional controls rendered independently of entry selection.' },
    { prop: 'FeedLayout empty', type: 'string | Snippet', description: 'Custom message or content when no entries are supplied.' },
    { prop: 'ReaderPane highlightLayer', type: 'Snippet', description: 'Optional overlay for host-provided text highlights.' },
    { prop: 'onAutomate', type: '(entryId) => void', description: 'Optional request to queue an entry for automation; cards, rows and the reader pane show the action only when it is set.' },
    { prop: 'ReaderPane automationBar', type: 'Snippet', description: 'Optional host-rendered strip above the article, such as an automation queue status.' },
    { prop: 'SelectionToolbar position', type: '{ x: number; y: number } | null', description: 'Viewport coordinates for the floating toolbar; null hides it.' },
    { prop: 'SelectionToolbar open', type: 'boolean', description: 'Host-controlled visibility; a position is also required.' },
    { prop: 'SelectionToolbar actions', type: 'readonly SelectionToolbarAction[]', description: 'Ordered actions with labels, optional icons, disabled state, and danger styling.' },
    { prop: 'SelectionToolbar onAction', type: '(actionId: string) => void', description: 'Emits the activated action ID for the host to handle.' },
    { prop: 'ViewModeToggle options', type: 'readonly FeedLayoutVariant[]', description: 'Restricts the layout choices displayed by the toggle.' },
    { prop: 'ViewModeToggle disabled', type: 'boolean', description: 'Disables layout choice buttons.' },
    { prop: 'SourceHealthBadge health', type: 'SourceHealth', description: 'Text and tone for healthy, unreachable, inactive, or dormant sources.' },
    { prop: 'SplitPane start / middle / end', type: 'Snippet / Snippet / Snippet?', description: 'Required first and middle panes, with an optional third pane.' },
    { prop: 'SplitPane startWidth / middleWidth / endWidth', type: 'string', description: 'Host-provided CSS grid sizes; defaults are 14rem, 1fr, and 22rem.' },
    { prop: 'SplitPane onStartWidthChange', type: '(widthPx: number) => void', description: 'Emits pointer or keyboard resize intent for the first pane.' },
    { prop: 'SplitPane onMiddleWidthChange', type: '(widthPx: number) => void', description: 'Emits resize intent for the middle pane when a third pane exists.' },
    { prop: 'SplitPane minPanePx', type: 'number', description: 'Minimum pane width used to clamp resize intents; defaults to 120 pixels.' },
    { prop: 'HighlightLayer text', type: 'string', description: 'Source text aligned with the reading surface.' },
    { prop: 'HighlightLayer highlights', type: 'readonly TextHighlight[]', description: 'Ranges and tones to mark over the source text.' },
    { prop: 'HighlightLayer activeId', type: 'string | null', description: 'Highlight ID receiving the active outline.' },
    { prop: 'HighlightLayer onHighlightClick', type: '(id: string) => void', description: 'Makes marked ranges actionable and emits their IDs.' },
    { prop: 'NarrationTransport src', type: 'string', description: 'Audio source URL; changing it resets transport progress.' },
    { prop: 'NarrationTransport label', type: 'string', description: 'Readable name for the narration control; defaults to Narration.' },
    { prop: 'NarrationTransport rates', type: 'readonly number[]', description: 'Playback speed choices shown by the transport.' },
    { prop: 'NarrationTransport onEnded', type: '() => void', description: 'Notifies the host when audio playback finishes.' },
    { prop: 'class', type: 'string', description: 'Optional CSS class forwarded to the relevant feed component root.' },
  ]
  const usage = `import { FeedLayout, ReaderPane, ViewModeToggle } from '@nebula/tint/feed'

let variant = $state<FeedLayoutVariant>('feed')
let selectedId = $state<string | null>(null)
<ViewModeToggle value={variant} onChange={(next) => variant = next} />
<FeedLayout {entries} {variant} {selectedId}
  onSelect={(id) => selectedId = id} />
<ReaderPane header={selectedEntry?.title ?? 'Choose an entry'}>
  <p>{selectedEntry?.body}</p>
</ReaderPane>`
</script>

<DocPage title="Feed and Reader" description="Host-controlled entries, layout, and selection over a plain TypeScript feed document. Switch layouts and choose an entry to update the reader pane." importPath="@nebula/tint/feed" {usage} {api} accessibility="Card and row titles are native selection buttons with visible focus and pressed state. Nested actions remain independent, and unread entries have a text label. Layout buttons expose their selected state in text and ARIA. Source health uses a text badge; the reader remains a semantic article.">
  <div class="feed-demo">
    <div class="toolbar"><ViewModeToggle value={variant} onChange={(next) => variant = next} /><span>Source <SourceHealthBadge health="healthy" /></span></div>
    <div class="columns">
      <FeedLayout {entries} {variant} {selectedId} onSelect={(id) => selectedId = id} sourceLabels={{ updates: 'Studio updates · rss', forum: 'Community · forum' }} />
      <div class="reader"><ReaderPane header={selectedEntry?.title ?? 'Choose an entry'}><p>{selectedEntry?.body ?? 'Choose an entry from the feed.'}</p></ReaderPane></div>
    </div>
    <p aria-live="polite">Selected entry: {selectedEntry?.title ?? 'none'}</p>
  </div>
</DocPage>

<style>
  .feed-demo { display: grid; gap: 1rem; }
  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; }
  .toolbar > span { display: inline-flex; align-items: center; gap: .4rem; color: var(--tint-muted); font-size: .8rem; }
  .columns { display: grid; gap: 1rem; min-width: 0; }
  .reader { min-height: 18rem; }
  p { margin: 0; color: var(--tint-muted); font-size: .84rem; }
  @container (min-width: 800px) { .columns { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
</style>
