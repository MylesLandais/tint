<script lang="ts">
  import {
    FeedLayout,
    ReaderPane,
    AutomationQueuePanel,
    SourceHealthBadge,
    ViewModeToggle,
    type AutomationQueueItem,
    type FeedEntry,
    type FeedLayoutVariant
  } from '../../svelte'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  let entries = $state<FeedEntry[]>([
    {
      id: 'article-1',
      sourceId: 'dle-blog',
      title: 'Princess Lexie - Eat it for My Lululemons (Full 1080p)',
      url: 'https://mixfemdomcc.com/dirty-talk-jerkkkhxxqxwzzfqqfztq/295076-princess-lexie-eat-it-for-my-lululemons.html',
      publishedAt: '2026-10-05T12:00:00Z',
      excerpt: 'mp4 | 1920x1080 | 518.53 MB | 00:16:45 — DLE listing protected by window.lock() and ajx.php challenge.',
      body: 'Complete scene description and media specifications parsed from DataLife Engine.\n\nSpecs: mp4 | 1920x1080 | 518.53 MB | 00:16:45.\n\nUnlock target: img.lock trigger invoking window.lock(). Link discovery target: k2s.cc/file/5a1376a4e6fa2.\n\nOnce unlocked, the depth discovery crawler traverses the filehost landing page, resolves the final CDN stream URL, streams the bytes with active rate tracking, probes the MP4 container via ffprobe, and verifies SHA-256 integrity before storing to SeaweedFS.',
      tags: ['1080p', 'mp4', 'dle'],
      readState: 'unread',
      contentKind: 'video',
      artifactStatus: 'none'
    },
    {
      id: 'article-2',
      sourceId: 'wp-feed',
      title: 'Nicole Nabors - Bounce Test Part 1',
      url: 'https://femdom-pov.me/nicole-nabors-bounce-test-part-1/',
      publishedAt: '2026-10-04T18:30:00Z',
      excerpt: 'Direct WordPress RSS entry. Currently streaming payload from CDN with active bandwidth telemetry.',
      body: 'WordPress post discovered via /feed/ RSS polling.\n\nAutomatic CDP challenge inspector resolved the captcha.php verification and extracted the high-speed download endpoint.\n\nCurrently receiving video chunks directly into local staging before ffprobe container validation.',
      tags: ['wp-feed', 'video', 'in-flight'],
      readState: 'read',
      contentKind: 'video',
      artifactStatus: 'downloading',
      downloadProgress: {
        percent: 68,
        bytesDownloaded: 352583680,
        totalBytes: 518530000,
        rateBytesPerSec: 14200000,
        etaSeconds: 12,
        stageText: 'Depth link discovery complete → Streaming CDN chunks...'
      }
    },
    {
      id: 'article-3',
      sourceId: 'wp-feed',
      title: 'QueenAnnellea - Oily and Messy [Verified Archive]',
      url: 'https://femdom-pov.me/queenannellea-oily-and-messy/',
      publishedAt: '2026-10-03T09:15:00Z',
      excerpt: 'Integrity verified: ffprobe stream check passed, SHA-256 match confirmed. Archived to SeaweedFS.',
      body: 'Verified archive entry.\n\nMedia Validator Summary:\n• ffprobe: H.264 High / AAC 48kHz / 1920x1080 / 29.97 fps (Container Playable OK)\n• Size: 842.1 MB (within 0.02 tolerance)\n• Duration: 00:24:18 (within 0.05 tolerance)\n• SHA-256: 8f49a88e2270929cf3e... verified\n• SeaweedFS: raw-data/downloads/2026/10/queenannellea.mp4',
      tags: ['verified', 'seaweedfs'],
      readState: 'read',
      contentKind: 'video',
      artifactStatus: 'ready'
    }
  ])

  let queue = $state<AutomationQueueItem[]>([
    {
      id: 'q-2',
      entryId: 'article-2',
      title: 'Nicole Nabors - Bounce Test Part 1',
      url: 'https://femdom-pov.me/nicole-nabors-bounce-test-part-1/',
      status: 'downloading',
      stageText: '3/4 Streaming CDN payload (14.2 MB/s)',
      progress: {
        percent: 68,
        bytesDownloaded: 352583680,
        totalBytes: 518530000,
        rateBytesPerSec: 14200000,
        etaSeconds: 12
      },
      createdAt: '2 mins ago'
    },
    {
      id: 'q-3',
      entryId: 'article-3',
      title: 'QueenAnnellea - Oily and Messy [Verified Archive]',
      url: 'https://femdom-pov.me/queenannellea-oily-and-messy/',
      status: 'ready',
      stageText: '4/4 ffprobe passed & SHA-256 verified · Stored in SeaweedFS',
      createdAt: '15 mins ago'
    }
  ])

  let variant = $state<FeedLayoutVariant>('feed')
  let selectedId = $state<string | null>('article-1')
  let activeTab = $state<'reader' | 'queue'>('reader')
  let selectedEntry = $derived(entries.find((entry) => entry.id === selectedId))

  function triggerAutomation(entryId: string) {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return

    // Step 1: Queued
    entry.artifactStatus = 'queued'
    const queueItem: AutomationQueueItem = {
      id: `q-${Date.now()}`,
      entryId: entry.id,
      title: entry.title,
      url: entry.url,
      status: 'queued',
      stageText: '1/4 Queued for automation worker dispatch...',
      createdAt: 'Just now'
    }
    queue = [queueItem, ...queue.filter((q) => q.entryId !== entryId)]

    // Step 2: CDP Unlock
    setTimeout(() => {
      entry.artifactStatus = 'unlocking'
      queueItem.status = 'unlocking'
      queueItem.stageText = '1/4 CDP unlock: Evaluating window.lock() on DOM and monitoring ajx.php...'
      queue = [...queue]
    }, 1200)

    // Step 3: Depth Link Discovery
    setTimeout(() => {
      entry.artifactStatus = 'discovering'
      queueItem.status = 'discovering'
      queueItem.stageText = '2/4 Depth link discovery: Found k2s.cc/file/5a1376a4e6fa2, bypassing cooldown timers...'
      queue = [...queue]
    }, 2800)

    // Step 4: Downloading
    setTimeout(() => {
      entry.artifactStatus = 'downloading'
      queueItem.status = 'downloading'
      queueItem.stageText = '3/4 Downloading: Streaming payload chunks...'
      entry.downloadProgress = {
        percent: 15,
        bytesDownloaded: 77779500,
        totalBytes: 518530000,
        rateBytesPerSec: 16800000,
        etaSeconds: 26,
        stageText: 'Streaming direct CDN bytes...'
      }
      queueItem.progress = entry.downloadProgress
      queue = [...queue]

      // Progress tick
      let pct = 15
      const timer = setInterval(() => {
        pct += 25
        if (pct >= 100) {
          clearInterval(timer)
          // Step 5: Validating
          entry.artifactStatus = 'validating'
          queueItem.status = 'validating'
          queueItem.stageText = '4/4 Validating: Running ffprobe stream checks and calculating SHA-256...'
          if (entry.downloadProgress) {
            entry.downloadProgress.percent = 100
            entry.downloadProgress.bytesDownloaded = entry.downloadProgress.totalBytes ?? 518530000
            entry.downloadProgress.stageText = 'ffprobe stream check & SHA-256 calculation...'
          }
          queue = [...queue]

          // Step 6: Ready / Verified
          setTimeout(() => {
            entry.artifactStatus = 'ready'
            queueItem.status = 'ready'
            queueItem.stageText = '✓ Verified: Container valid, SHA-256 match, archived to SeaweedFS.'
            queue = [...queue]
          }, 1500)
        } else {
          if (entry.downloadProgress) {
            entry.downloadProgress.percent = pct
            entry.downloadProgress.bytesDownloaded = Math.round((pct / 100) * (entry.downloadProgress.totalBytes ?? 518530000))
            entry.downloadProgress.etaSeconds = Math.max(0, Math.round((100 - pct) / 2))
          }
          queueItem.progress = entry.downloadProgress
          queue = [...queue]
        }
      }, 700)
    }, 4200)
  }

  function cancelQueueItem(itemId: string) {
    const item = queue.find((q) => q.id === itemId)
    if (item) {
      const entry = entries.find((e) => e.id === item.entryId)
      if (entry) entry.artifactStatus = 'none'
    }
    queue = queue.filter((q) => q.id !== itemId)
  }

  function retryQueueItem(itemId: string) {
    const item = queue.find((q) => q.id === itemId)
    if (item) triggerAutomation(item.entryId)
  }

  const api: ApiRow[] = [
    { prop: 'onAutomate', type: '(entryId: string) => void', description: 'Callback emitted when an article is sent through the automation ingest pipeline.' },
    { prop: 'entry.artifactStatus', type: 'ArtifactStatus', description: 'Lifecycle state: none, queued, unlocking, discovering, downloading, validating, ready, failed.' },
    { prop: 'entry.downloadProgress', type: 'DownloadProgress', description: 'Real-time download telemetry: percent, bytesDownloaded, totalBytes, rateBytesPerSec, etaSeconds, stageText.' },
    { prop: 'AutomationQueuePanel', type: 'Component', description: 'Dedicated panel displaying in-flight and historical automation runs, live progress bars, and pipeline step breakdowns.' },
    { prop: 'ReaderPane automationBar / entry', type: 'Snippet / FeedEntry', description: 'Contextual automation banner inside the article reader with direct triggers and status feedback.' }
  ]

  const usage = `import { FeedLayout, ReaderPane, AutomationQueuePanel } from '@nebula/tint/feed'

<FeedLayout
  {entries}
  {variant}
  {selectedId}
  onSelect={(id) => selectedId = id}
  onAutomate={(id) => sendToAutomation(id)}
/>

<ReaderPane entry={selectedEntry} onAutomate={(id) => sendToAutomation(id)}>
  <p>{selectedEntry?.body}</p>
</ReaderPane>

<AutomationQueuePanel
  items={queueItems}
  onSelect={(id) => selectedId = id}
  onCancel={(id) => cancelQueue(id)}
  onRetry={(id) => retryQueue(id)}
/>`
</script>

<DocPage
  title="Feed Automation & Download Queue"
  description="Send feed articles through browser automation: trigger JavaScript unlock routines (window.lock() via CDP), recursively discover depth download links, track live download progress, and verify file integrity (ffprobe + SHA-256)."
  importPath="@nebula/tint/feed"
  {usage}
  {api}
  accessibility="Automation actions and progress bars feature full ARIA roles, live regions for state transitions, keyboard focus indicators, and tabular numeric values for streaming download rates."
>
  <div class="automation-demo">
    <div class="demo-toolbar">
      <div class="toolbar-left">
        <ViewModeToggle value={variant} onChange={(next) => variant = next} />
        <div class="tab-pill-group">
          <button type="button" class="tab-btn" class:active={activeTab === 'reader'} onclick={() => activeTab = 'reader'}>
            Split Reader View
          </button>
          <button type="button" class="tab-btn" class:active={activeTab === 'queue'} onclick={() => activeTab = 'queue'}>
            Queue Manager ({queue.length})
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <span>Blog Ingest: <SourceHealthBadge health="healthy" /></span>
      </div>
    </div>

    {#if activeTab === 'reader'}
      <div class="split-workspace">
        <div class="feed-column">
          <FeedLayout
            {entries}
            {variant}
            {selectedId}
            onSelect={(id) => selectedId = id}
            onAutomate={triggerAutomation}
            sourceLabels={{ 'dle-blog': 'DLE Listing · mixfemdomcc', 'wp-feed': 'WordPress RSS · femdom-pov' }}
          />
        </div>
        <div class="reader-column">
          <ReaderPane
            entry={selectedEntry}
            header={selectedEntry?.title ?? 'Select an article'}
            onAutomate={triggerAutomation}
          >
            <div class="article-content">
              {#each (selectedEntry?.body ?? 'Select an article from the feed to view its content and automation status.').split('\n\n') as para}
                <p>{para}</p>
              {/each}
            </div>
          </ReaderPane>
        </div>
      </div>
    {:else}
      <div class="queue-workspace">
        <AutomationQueuePanel
          items={queue}
          activeId={selectedId}
          onSelect={(id: string) => { selectedId = id; activeTab = 'reader'; }}
          onCancel={cancelQueueItem}
          onRetry={retryQueueItem}
        />
      </div>
    {/if}

    <div class="pipeline-explainer">
      <h3>Pipeline Stages:</h3>
      <ol class="pipeline-steps">
        <li><strong>1. Discover Article:</strong> Ingest post from RSS / DLE listing or browser history.</li>
        <li><strong>2. CDP Unlock Call:</strong> Attach to Chrome DevTools Protocol and invoke <code>window.lock()</code> / <code>ajx.php</code> challenge.</li>
        <li><strong>3. Depth Link Discovery:</strong> Harvest hidden <code>k2s.cc</code> / filehost endpoints and traverse download gates.</li>
        <li><strong>4. Stream &amp; Progress:</strong> Stream payload with real-time throughput and ETA calculation.</li>
        <li><strong>5. Verify Integrity:</strong> Probe container streams via <code>ffprobe</code> and match SHA-256 hash.</li>
        <li><strong>6. Storage Archival:</strong> Push validated artifact to SeaweedFS / S3.</li>
      </ol>
    </div>
  </div>
</DocPage>

<style>
  .automation-demo { display: grid; gap: 1rem; }
  .demo-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .toolbar-left { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .toolbar-right { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--tint-muted); }

  .tab-pill-group { display: flex; background: var(--tint-panel); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); padding: 2px; }
  .tab-btn { border: 0; background: none; padding: 0.25rem 0.65rem; font-size: var(--tint-font-size-xs); font-weight: 500; color: var(--tint-muted); border-radius: var(--tint-radius-sm); cursor: pointer; transition: all 0.15s; }
  .tab-btn.active { background: var(--tint-surface); color: var(--tint-ink); font-weight: 600; box-shadow: 0 1px 2px var(--tint-shadow-color); }

  .split-workspace { display: grid; gap: 1rem; min-height: 28rem; }
  .feed-column { min-width: 0; }
  .reader-column { min-height: 20rem; }
  .article-content { display: flex; flex-direction: column; gap: 0.75rem; color: var(--tint-ink); font-size: var(--tint-font-size-sm); line-height: 1.6; }
  .article-content p { margin: 0; }

  .queue-workspace { min-height: 26rem; }

  .pipeline-explainer { background: var(--tint-surface); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); padding: 1rem; margin-top: 0.5rem; }
  .pipeline-explainer h3 { margin: 0 0 0.5rem; font-size: var(--tint-font-size-sm); font-weight: 600; color: var(--tint-ink); }
  .pipeline-steps { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.25rem; font-size: var(--tint-font-size-xs); color: var(--tint-muted); }
  .pipeline-steps code { font-family: var(--font-mono, monospace); font-size: 0.9em; padding: 0.1rem 0.25rem; background: var(--tint-panel); border-radius: 3px; }

  @container (min-width: 860px) {
    .split-workspace { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  }
</style>
