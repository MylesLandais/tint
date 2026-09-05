import { useMemo, useState } from 'react'
import { createBrowserPlaybackAdapter, createTintClient, TintClientProvider, useClientStatus, usePlayback } from '../client'
import { Avatar, AvatarGroup, type Identity } from '../components/identity'
import { Card, Surface } from '../components/surface'
import { ConnectionStatus, EmptyState, Skeleton } from '../components/status'
import { Breadcrumbs, NavigationList } from '../components/navigation'
import { Tabs } from '../components/menu'
import { GalleryGrid, UploadDropzone, type MediaAsset } from '../components/media-assets'
import { PlaybackQueue } from '../components/media-player'
import { BarChart, MetricCard, TimeSeriesChart } from '../components/charts'
import { WorkspaceGrid, type WorkspaceDocument } from '../components/workspace-grid'
import { DocsCallout, DocsDemo, DocsPage, DocsSection } from './components/DocsPage'
import { PropsTable } from './components/PropsTable'

const people: readonly Identity[] = [
  { id: 'maya', name: 'Maya Chen', presence: 'online' },
  { id: 'river', name: 'River Osei', presence: 'away' },
  { id: 'sam', name: 'Sam Patel', presence: 'busy' },
]
const media: readonly MediaAsset[] = [
  { id: 'one', src: '/images/gallery-1.svg', alt: 'Abstract flower study' },
  { id: 'two', src: '/images/gallery-2.svg', alt: 'Geometric landscape study' },
]
const points = [
  { day: 'Mon', active: 18, uploads: 4 },
  { day: 'Tue', active: 27, uploads: 8 },
  { day: 'Wed', active: 24, uploads: 6 },
] as const
const series = [
  { key: 'active', label: 'Active users' },
  { key: 'uploads', label: 'Uploads' },
] as const

const frameworkApiRows = [
  { name: 'client', type: 'TintClient', required: true, description: 'Root provider client.' },
  { name: 'children', type: 'ReactNode', required: true, description: 'Provider, card, or popover content.' },
  { name: 'identity', type: 'Identity', description: 'Shared person or agent model.' },
  { name: 'identities', type: 'readonly Identity[]', description: 'AvatarGroup identities.' },
  { name: 'name/src/alt', type: 'string', description: 'Explicit avatar presentation overrides.' },
  { name: 'size', type: 'AvatarSize', description: 'Deterministic avatar size token.' },
  { name: 'presence', type: 'Presence', description: 'Host-owned availability state.' },
  { name: 'badge', type: 'ReactNode', description: 'Avatar badge slot.' },
  { name: 'decorative', type: 'boolean', description: 'Removes the avatar from the accessibility tree.' },
  { name: 'max', type: 'number', description: 'Maximum visible avatars.' },
  { name: 'renderLink', type: 'function', description: 'Router-neutral identity or navigation link renderer.' },
  { name: 'as', type: "'div' | 'section' | 'article' | 'aside'", description: 'Surface semantic element.' },
  { name: 'tone', type: 'string', description: 'Surface or metric emphasis.' },
  { name: 'elevation', type: 'SurfaceElevation', description: 'Tint-owned shadow token.' },
  { name: 'interactive/selected', type: 'boolean', description: 'Surface interaction state.' },
  { name: 'header/footer/actions', type: 'ReactNode', description: 'Card or shell slots.' },
  { name: 'bodyClassName', type: 'string', description: 'Card body styling hook.' },
  { name: 'lines', type: 'number', description: 'Skeleton line count.' },
  { name: 'label', type: 'string', description: 'Accessible or visible label.' },
  { name: 'icon', type: 'ReactNode', description: 'Optional visual state icon.' },
  { name: 'retryLabel', type: 'string', description: 'Error retry copy.' },
  { name: 'onRetry', type: '() => void', description: 'Retry intent.' },
  { name: 'action', type: 'ReactNode', description: 'State action override.' },
  { name: 'state', type: 'ConnectionState', description: 'Controlled connection state.' },
  { name: 'labels', type: 'Record<string, string>', description: 'Connection labels.' },
  { name: 'brand/header/search/sidebar/breadcrumbs', type: 'ReactNode', description: 'AppShell slots.' },
  { name: 'sidebarOpen', type: 'boolean', description: 'Controlled mobile navigation state.' },
  { name: 'onSidebarOpenChange', type: '(open: boolean) => void', description: 'Sidebar open intent.' },
  { name: 'sidebarLabel', type: 'string', description: 'Accessible sidebar name.' },
  { name: 'items', type: 'readonly item[]', description: 'Navigation or menu items.' },
  { name: 'activeHref', type: 'string', description: 'Current router-neutral navigation href.' },
  { name: 'onNavigate', type: '(item) => void', description: 'Navigation intent.' },
  { name: 'open', type: 'boolean', description: 'Controlled overlay or lightbox state.' },
  { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Overlay open intent.' },
  { name: 'trigger', type: 'ReactElement', description: 'Popover or menu trigger.' },
  { name: 'title/description', type: 'ReactNode', description: 'Overlay or empty-state copy.' },
  { name: 'className', type: 'string', description: 'Root styling hook.' },
  { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", description: 'Popover placement.' },
  { name: 'tabs', type: 'readonly TabItem[]', description: 'Controlled tab definitions.' },
  { name: 'value', type: 'string | ReactNode', description: 'Selected tab or metric value.' },
  { name: 'onValueChange', type: '(value: string) => void', description: 'Tab selection intent.' },
  { name: 'accept', type: 'readonly string[]', description: 'Accepted MIME or extension patterns.' },
  { name: 'maxSizeBytes/maxFiles', type: 'number', description: 'Upload admission limits.' },
  { name: 'disabled', type: 'boolean', description: 'Locks an interaction surface.' },
  { name: 'onFilesAccepted/onFilesRejected', type: 'function', description: 'Validated file selection results.' },
  { name: 'tasks', type: 'readonly UploadTask[]', description: 'Controlled upload queue.' },
  { name: 'onCancel', type: '(id: string) => void', description: 'Upload cancellation intent.' },
  { name: 'emptyLabel', type: 'string', description: 'Upload queue empty copy.' },
  { name: 'assets', type: 'readonly MediaAsset[]', description: 'Gallery or lightbox media.' },
  { name: 'onSelect', type: '(index, asset) => void', description: 'Gallery selection intent.' },
  { name: 'currentItemId/status/positionSeconds', type: 'playback state', description: 'Controlled current queue item, transport state, and browser-restored position.' },
  { name: 'index', type: 'number', description: 'Controlled lightbox index.' },
  { name: 'onClose', type: '() => void', description: 'Lightbox close intent.' },
  { name: 'onIndexChange', type: '(index: number) => void', description: 'Lightbox navigation intent.' },
  { name: 'data/series/xKey', type: 'chart contracts', description: 'Engine-neutral chart data.' },
  { name: 'height', type: 'number', description: 'Chart viewport height.' },
  { name: 'empty', type: 'ReactNode', description: 'Chart or notification empty state.' },
  { name: 'xFormatter/valueFormatter', type: 'ChartFormatter', description: 'Host-owned display formatting.' },
  { name: 'tableCaption', type: 'string', description: 'Accessible chart table caption.' },
  { name: 'showTable', type: 'boolean', description: 'Expose the chart data table.' },
  { name: 'hint', type: 'ReactNode', description: 'Metric supporting copy.' },
  { name: 'trend', type: 'MetricTrend', description: 'Controlled metric direction and label.' },
  { name: 'document', type: 'WorkspaceDocument', required: true, description: 'Revisioned controlled workspace.' },
  { name: 'breakpoints/columns', type: 'Record<string, number>', description: 'Responsive grid definitions.' },
  { name: 'rowHeight', type: 'number', description: 'Workspace row height.' },
  { name: 'margin', type: '[number, number]', description: 'Workspace item gap.' },
  { name: 'collisionMode', type: 'WorkspaceCollisionMode', description: 'Compact, prevent, or free placement.' },
  { name: 'renderItem', type: '(item, breakpoint) => ReactNode', required: true, description: 'Application-owned widget renderer.' },
  { name: 'onDocumentChange', type: '(document, command) => void', required: true, description: 'Workspace mutation intent.' },
]

const clientCode = `import { createTintClient, TintClientProvider } from 'tint/client'

const client = createTintClient({
  request,
  auth,
  navigation,
  realtime,
  uploads,
  storage,
  playback: createBrowserPlaybackAdapter(),
})

root.render(
  <TintClientProvider client={client}>
    <App />
  </TintClientProvider>,
)`

function ClientStatusDemo() {
  const snapshot = useClientStatus()
  return <ConnectionStatus state={snapshot.status === 'ready' ? 'online' : 'connecting'} labels={{ online: `Ready: ${snapshot.readyCapabilities.join(', ') || 'request'}` }} />
}

function BrowserPlaybackDemo() {
  const { client, snapshot } = usePlayback()
  return (
    <PlaybackQueue
      items={snapshot.queue.map((item) => ({ ...item, subtitle: item.artist }))}
      currentItemId={snapshot.currentItemId}
      status={snapshot.status}
      positionSeconds={snapshot.positionSeconds}
      emptyLabel="No browser playback queue has been saved for this origin."
      onSelect={(item) => client.select(item.id)}
    />
  )
}

export function ClientFrameworkDoc() {
  const [tab, setTab] = useState('line')
  const [workspace, setWorkspace] = useState<WorkspaceDocument>({
    id: 'docs-workspace', revision: '1',
    layouts: { lg: [{ id: 'metrics', x: 0, y: 0, w: 6, h: 3 }, { id: 'team', x: 6, y: 0, w: 6, h: 3 }], md: [{ id: 'metrics', x: 0, y: 0, w: 4, h: 3 }, { id: 'team', x: 4, y: 0, w: 4, h: 3 }], sm: [{ id: 'metrics', x: 0, y: 0, w: 4, h: 3 }, { id: 'team', x: 0, y: 3, w: 4, h: 3 }] },
  })
  const client = useMemo(() => createTintClient({
    request: { async send() { throw new Error('Docs request adapter is inert.') } },
    playback: createBrowserPlaybackAdapter(),
  }), [])

  return (
    <DocsPage route="components/client-framework" title="Client framework" intro="The shared application boundary introduced in Tint 0.2: one typed client, provider-free visual primitives, and private engine adapters.">
      <DocsSection id="client" title="Root client" description="Construct one client from application-owned adapters. Hooks subscribe only to the capability they use.">
        <DocsDemo code={clientCode}><TintClientProvider client={client}><ClientStatusDemo /></TintClientProvider></DocsDemo>
      </DocsSection>

      <DocsSection id="foundations" title="Identity, surfaces, and state">
        <div className="grid gap-4 md:grid-cols-3">
          <Card header="Identity" footer={<AvatarGroup identities={people} size="sm" />}><div className="flex items-center gap-3"><Avatar identity={people[0]} size="lg" /><div><strong>{people[0]?.name}</strong><p className="m-0 text-xs text-tint-muted">Shared by auth, chat, activity, and notifications.</p></div></div></Card>
          <Surface className="p-4"><Skeleton lines={3} /><ConnectionStatus state="reconnecting" className="mt-4" /></Surface>
          <Surface><EmptyState title="Nothing here yet" description="Applications supply the action and domain copy." /></Surface>
        </div>
      </DocsSection>

      <DocsSection id="navigation" title="Router-neutral navigation">
        <Surface className="grid gap-3 p-4 md:grid-cols-[12rem_1fr]">
          <NavigationList activeHref="#/home" items={[{ id: 'home', label: 'Home', href: '#/home' }, { id: 'uploads', label: 'Uploads', href: '#/uploads' }]} />
          <div><Breadcrumbs items={[{ id: 'home', label: 'Home', href: '#/home' }, { id: 'current', label: 'Workspace' }]} /><p className="text-sm text-tint-muted">Supply renderLink or a navigation adapter to connect any router.</p></div>
        </Surface>
      </DocsSection>

      <DocsSection id="media" title="Media intake and viewing">
        <div className="grid gap-4 md:grid-cols-2"><UploadDropzone accept={['image/*']} maxFiles={4} onFilesAccepted={() => {}} /><GalleryGrid assets={media} /></div>
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.6fr)]">
          <TintClientProvider client={client}><BrowserPlaybackDemo /></TintClientProvider>
          <DocsCallout variant="note" title="Local metadata, not media credentials">
            The playback adapter restores queue titles, source links, artwork, and position from
            this browser&apos;s <code>localStorage</code> and follows storage events from other tabs.
            Signed media URLs and request credentials are intentionally outside its contract.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="data" title="Metrics, charts, and workspaces">
        <div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Active users" value="27" hint="9 more than Monday" trend={{ direction: 'up', label: '+50%' }} /><MetricCard label="Upload queue" value="8" hint="2 processing" tone="accent" /></div>
        <Tabs
          className="mt-4"
          value={tab}
          onValueChange={setTab}
          tabs={[
            { id: 'line', label: 'Time series', content: <TimeSeriesChart data={points} series={series} xKey="day" /> },
            { id: 'bar', label: 'Bars', content: <BarChart data={points} series={series} xKey="day" /> },
          ]}
        />
        <WorkspaceGrid className="mt-6" document={workspace} onDocumentChange={setWorkspace} renderItem={(item) => <Surface className="h-full p-3"><strong>{item.id}</strong><p className="text-xs text-tint-muted">Drag, resize, or use Alt+Arrow.</p></Surface>} />
      </DocsSection>

      <DocsSection id="boundaries" title="Application boundaries">
        <DocsCallout variant="note" title="Tint standardizes seams, not product semantics">Routes, endpoint definitions, credentials, persistence, encryption, retry policy, moderation, and social rules remain in the consuming application.</DocsCallout>
      </DocsSection>
      <DocsSection id="api" title="API" description="Public props are engine-neutral; application and router behavior enters through callbacks and adapters.">
        <PropsTable rows={frameworkApiRows} />
      </DocsSection>
    </DocsPage>
  )
}
