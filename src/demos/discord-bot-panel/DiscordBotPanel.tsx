import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TintClientProvider,
  createTintClient,
  useCapability,
  useClientStatus,
  useConnection,
  useOperations,
  useTintClient,
} from '../../client'
import type { TintOperation } from '../../client'
import { ErrorBanner } from '../../components/shell'
import type { CommandPaletteItem, WorkspaceTab } from '../../components/shell'
import { Card, Surface } from '../../components/surface'
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import type { BadgeTone } from '../../components/badge'
import { ProgressBar } from '../../components/progress'
import { EmptyState } from '../../components/status'
import { DataTable } from '../../components/table'
import type { TableColumn } from '../../components/table'
import { FormControl, SelectField, SliderField, TextField, ToggleField } from '../../components/form'
import { MetricCard, TimeSeriesChart } from '../../components/charts'
import { ToastProvider, useToast } from '../../components/toast'
import { createLudisHost, type LudisHost, type PanelCommandInput, type PanelCommandName, type RealtimeScenario, type GuildReadModel } from './adapters'
import { GUILDS, SIGNED_IN_USER, STATIONS, formatAge, formatDuration, type PlayerSnapshot, type QueueEntry } from './fixtures'
import {
  buildCorrelationIndex,
  bundleFor,
  CommandRollupTable,
  ConversationTraceView,
  CorrelationFindings,
  createTraffic,
  EMPTY_FILTERS,
  filterInteractions,
  InteractionFeed,
  InteractionFilterBar,
  InteractionMetrics,
  LinkedRecords,
  PanelTemplate,
  PANEL_GUILDS,
  runCorrelations,
  type CorrelationFinding,
  type InteractionFilters,
} from '../discord-panel'
import { useLiveInteractions } from './useLiveInteractions'

const TICK_MS = 700

const QUEUE_STATE_TONES: Record<QueueEntry['state'], BadgeTone> = {
  queued: 'neutral',
  preparing: 'info',
  'reading playlist': 'info',
  ready: 'success',
}

const OPERATION_TONES: Record<TintOperation['state'], BadgeTone> = {
  queued: 'neutral',
  running: 'info',
  succeeded: 'success',
  failed: 'danger',
  cancelled: 'warning',
}

const REALTIME_SCENARIOS: readonly { id: RealtimeScenario; label: string }[] = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'flaky', label: 'Flaky' },
  { id: 'offline', label: 'Offline' },
]

export type DiscordBotPanelProps = {
  /** Injected by the test so the simulation can be stepped by hand. */
  host?: LudisHost
  /** `false` stops the panel driving `advance()` from an interval. */
  autoAdvance?: boolean
}

export function DiscordBotPanel({ host: injectedHost, autoAdvance = true }: DiscordBotPanelProps) {
  const [guildId, setGuildId] = useState(GUILDS[0]!.id)
  const host = useMemo(() => injectedHost ?? createLudisHost(guildId), [injectedHost, guildId])
  const client = useMemo(
    () =>
      createTintClient({
        request: host.request,
        operations: host.operations,
        realtime: host.realtime,
        // The guild player is ludis's, not the browser's, so it is registered
        // as a host capability rather than squeezed into `playback`.
        capabilities: { guildPlayer: host.guildPlayer },
      }),
    [host],
  )

  useEffect(() => {
    host.guildPlayer.setGuild(guildId)
  }, [host, guildId])

  useEffect(() => {
    if (!autoAdvance) return
    const timer = setInterval(() => host.advance(), TICK_MS)
    return () => clearInterval(timer)
  }, [host, autoAdvance])

  return (
    <TintClientProvider client={client}>
      <ToastProvider>
        <PanelBody host={host} guildId={guildId} onGuildChange={setGuildId} />
      </ToastProvider>
    </TintClientProvider>
  )
}

function PanelBody({
  host,
  guildId,
  onGuildChange,
}: {
  host: LudisHost
  guildId: string
  onGuildChange: (guildId: string) => void
}) {
  const client = useTintClient()
  const status = useClientStatus()
  const connection = useConnection()
  const { snapshot: player } = useCapability<PlayerSnapshot>('guildPlayer')
  const { client: operations, snapshot: operationSnapshot } = useOperations()
  const toast = useToast()

  const [readModel, setReadModel] = useState<GuildReadModel | null>(null)
  const [query, setQuery] = useState('')
  const [station, setStation] = useState(STATIONS[0]!.key)
  const [volume, setVolume] = useState(player.volume)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [scenario, setScenario] = useState<RealtimeScenario>('healthy')
  const [queueDepth, setQueueDepth] = useState<readonly { tick: number; depth: number }[]>([])
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('player')
  const [filters, setFilters] = useState<InteractionFilters>(EMPTY_FILTERS)
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const queryRef = useRef<HTMLInputElement>(null)

  // Recorded guild traffic. Built once: it is history, and rebuilding it on
  // every render would reshuffle the feed under the operator's cursor.
  const traffic = useMemo(() => createTraffic(), [])
  const live = useLiveInteractions(operationSnapshot.operations)

  const guild = GUILDS.find((candidate) => candidate.id === guildId)!
  const pending = operationSnapshot.operations.filter(
    (operation) => operation.state === 'queued' || operation.state === 'running',
  )
  const busy = pending.length > 0 || player.busy

  // Re-read the guild read model whenever a command settles. ludis rebuilds
  // the whole fragment on every poll; one fetch per settle is the same
  // information with far less churn.
  const settledCount = operationSnapshot.operations.length - pending.length
  useEffect(() => {
    let live = true
    void client.request
      .send<GuildReadModel>({ method: 'GET', url: `/guild/${guildId}` })
      .then((response) => {
        if (live) setReadModel(response.data)
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [client, guildId, settledCount])

  useEffect(() => {
    setVolume(player.volume)
  }, [player.volume])

  useEffect(() => {
    setQueueDepth((current) => [...current, { tick: current.length, depth: player.queue.length }].slice(-24))
  }, [player.queue.length, player.position])

  const submit = useCallback(
    (name: PanelCommandName, input: Omit<PanelCommandInput, 'guildId'> = {}) => {
      const handle = operations.submit({
        name,
        input: { guildId, ...input },
        // ludis dedupes on a client-generated request_id; so does this.
        idempotencyKey: `${name}:${guildId}:${JSON.stringify(input)}:${Date.now()}`,
      })
      // The operation snapshot carries no input, so the feed needs the guild,
      // the channel and the arguments captured here at submit time.
      live.record(handle.id, {
        guildId,
        channel: player.channel ?? 'general',
        actor: SIGNED_IN_USER,
        options: input as Record<string, string | number | boolean>,
      })
      void handle.settled.then((operation) => {
        toast.push({
          title: operation.state === 'succeeded' ? `${operation.name} applied` : `${operation.name} ${operation.state}`,
          description: operation.problem?.detail ?? operation.message,
          tone: operation.state === 'succeeded' ? 'success' : operation.state === 'failed' ? 'danger' : 'info',
        })
      })
      return handle
    },
    [operations, guildId, toast, live, player.channel],
  )

  const commands: readonly CommandPaletteItem[] = useMemo(
    () => [
      { id: 'player:resume', label: 'Resume playback', group: 'Player', shortcut: 'Space', disabled: !player.paused },
      { id: 'player:pause', label: 'Pause playback', group: 'Player', shortcut: 'Space', disabled: player.paused },
      { id: 'player:skip', label: 'Skip to next track', group: 'Player', shortcut: 'N' },
      { id: 'player:stop', label: 'Stop and clear the queue', group: 'Player' },
      { id: 'volume:down', label: 'Lower the volume', group: 'Player', shortcut: '[' },
      { id: 'volume:up', label: 'Raise the volume', group: 'Player', shortcut: ']' },
      ...STATIONS.map((item) => ({ id: `radio:${item.key}`, label: `Play ${item.name}`, group: 'Radio', keywords: ['station', 'radio'] })),
      { id: 'view:commands', label: 'Show the slash command feed', group: 'Views' },
      { id: 'view:correlations', label: 'Run correlations', group: 'Views' },
      { id: 'view:trace', label: 'Follow the selected trace', group: 'Views' },
      ...GUILDS.filter((candidate) => candidate.id !== guildId).map((candidate) => ({
        id: `guild:${candidate.id}`,
        label: `Switch to ${candidate.name}`,
        group: 'Guilds',
      })),
    ],
    [player.paused, guildId],
  )

  const runCommand = useCallback(
    (id: string) => {
      setPaletteOpen(false)
      setPaletteQuery('')
      if (id.startsWith('guild:')) return onGuildChange(id.slice('guild:'.length))
      if (id.startsWith('view:')) {
        const view = id.slice('view:'.length)
        setActiveTab(view)
        if (view === 'correlations') setHasRun(true)
        return
      }
      if (id.startsWith('radio:')) return void submit('play:radio', { station: id.slice('radio:'.length) })
      if (id === 'volume:up') return void submit('player:volume', { level: Math.min(100, volume + 5) })
      if (id === 'volume:down') return void submit('player:volume', { level: Math.max(0, volume - 5) })
      void submit(id as PanelCommandName)
    },
    [onGuildChange, submit, volume],
  )

  // ludis's panel has no shortcuts at all; a control surface people sit in
  // front of all evening should. Typing in a field never triggers one.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === ' ') {
        event.preventDefault()
        runCommand(player.paused ? 'player:resume' : 'player:pause')
      } else if (event.key.toLowerCase() === 'n') runCommand('player:skip')
      else if (event.key === '[') runCommand('volume:down')
      else if (event.key === ']') runCommand('volume:up')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [runCommand, player.paused])

  const queueColumns: readonly TableColumn<QueueEntry>[] = useMemo(
    () => [
      { id: 'title', header: 'Track', renderCell: (row) => <span className="font-medium">{row.title}</span> },
      { id: 'author', header: 'Artist' },
      { id: 'source', header: 'Source', renderCell: (row) => <code className="text-xs">{row.source}</code> },
      { id: 'length', header: 'Length', align: 'end', renderCell: (row) => formatDuration(row.length) },
      { id: 'requester', header: 'Requested by' },
      {
        id: 'state',
        header: 'State',
        renderCell: (row) => <Badge tone={QUEUE_STATE_TONES[row.state]}>{row.state}</Badge>,
      },
    ],
    [],
  )

  const failedCapability = status.failedCapabilities[0]
  const playerError = player.error && player.error !== dismissedError ? player.error : null

  // ------------------------------------------------------------ correlation

  // The panel's own submissions and the guild's recorded traffic are one feed,
  // joined on the correlation id, so an operator never has to ask which of the
  // two surfaces a command came from.
  const combined = useMemo(() => {
    const recorded = traffic[guildId]
    return {
      interactions: [...live.interactions, ...(recorded?.interactions ?? [])],
      traces: [...live.traces, ...(recorded?.traces ?? [])],
      moderation: recorded?.moderation ?? [],
      audit: recorded?.audit ?? [],
    }
  }, [traffic, guildId, live])

  const bundles = useMemo(() => buildCorrelationIndex(combined), [combined])
  const visible = useMemo(() => filterInteractions(combined.interactions, filters), [combined.interactions, filters])
  const selected = bundleFor(bundles, selectedCorrelationId)

  // Correlations run over what is on screen: filtering to one channel and
  // re-running is how an operator tests whether the channel was the variable.
  const findings: readonly CorrelationFinding[] = useMemo(() => {
    if (!hasRun) return []
    const visibleIds = new Set(visible.map((item) => item.correlationId))
    return runCorrelations(bundles.filter((bundle) => visibleIds.has(bundle.correlationId)))
  }, [hasRun, bundles, visible])

  const settledVisible = visible.filter((item) => item.status === 'replied' || item.status === 'failed').length

  const followCorrelation = useCallback((correlationId: string) => {
    setSelectedCorrelationId(correlationId)
    setActiveTab('trace')
  }, [])

  const tabs: readonly WorkspaceTab[] = [
    {
      id: 'player',
      label: 'Player',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <NowPlaying
            player={player}
            busy={busy}
            volume={volume}
            onVolumeChange={setVolume}
            onVolumeCommit={(level) => void submit('player:volume', { level })}
            onCommand={(name) => void submit(name)}
          />

          <Card header="Up next" actions={<span className="text-xs text-tint-muted">{player.queue.length} / {player.queueLimit}</span>}>
            <DataTable
              rows={player.queue}
              columns={queueColumns}
              rowId="id"
              density="compact"
              label={`Queue for ${guild.name}`}
              rowHeaderColumn="title"
              emptyState={<EmptyState title="The queue is empty" description="Add a track or start a radio station." />}
            />
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Queue depth" value={String(player.queue.length)} hint={`Cap ${player.queueLimit}`} tone="accent" />
            <MetricCard label="Volume" value={`${player.volume}%`} hint={player.paused ? 'Paused' : 'Playing'} />
            <MetricCard label="In flight" value={String(pending.length)} hint={pending[0]?.name ?? 'Idle'} />
          </div>

          <Card header="Queue depth over time">
            <TimeSeriesChart
              data={queueDepth.map((point) => ({ tick: `t${point.tick}`, depth: point.depth }))}
              series={[{ key: 'depth', label: 'Queued tracks' }]}
              xKey="tick"
              height={160}
              empty={<EmptyState title="No samples yet" />}
            />
          </Card>
        </div>
      ),
    },
    {
      id: 'commands',
      label: 'Slash commands',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <InteractionFilterBar interactions={combined.interactions} filters={filters} onFiltersChange={setFilters} />
          <InteractionMetrics interactions={visible} />
          <Card header="Interactions" actions={<span className="text-xs text-tint-muted">{visible.length} shown</span>}>
            <InteractionFeed interactions={visible} selectedId={selectedCorrelationId} onSelect={followCorrelation} />
          </Card>
        </div>
      ),
    },
    {
      id: 'correlations',
      label: 'Correlations',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <InteractionFilterBar interactions={combined.interactions} filters={filters} onFiltersChange={setFilters} />
          <CorrelationFindings
            findings={findings}
            hasRun={hasRun}
            sampleSize={settledVisible}
            onRun={() => setHasRun(true)}
          />
          <Card header="By command">
            <CommandRollupTable interactions={visible} />
          </Card>
        </div>
      ),
    },
    {
      id: 'trace',
      label: 'Agent trace',
      // Mounted only when it is the open tab: the service map brings the graph
      // engine with it, and every tab panel stays in the DOM once rendered.
      content: activeTab === 'trace' ? <ConversationTraceView bundle={selected} /> : null,
    },
  ]

  return (
    <PanelTemplate
      product="Ludis"
      productSubtitle="Bot control"
      signedInAs={SIGNED_IN_USER}
      guilds={PANEL_GUILDS}
      guildId={guildId}
      onGuildChange={onGuildChange}
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      banner={
        <>
          {failedCapability ? (
            <ErrorBanner
              title={`The ${failedCapability} capability failed to start`}
              detail={status.problem?.detail}
              actions={<Button onClick={() => void client.restart(failedCapability)}>Retry {failedCapability}</Button>}
            />
          ) : null}
          {playerError ? (
            <ErrorBanner
              title="The last command failed"
              detail={playerError}
              onDismiss={() => setDismissedError(playerError)}
            />
          ) : null}
        </>
      }
      connection={{
        state: connection.state === 'online' ? 'connected' : connection.state === 'offline' ? 'disconnected' : 'connecting',
        label: `Poll ${connection.state}${connection.attempt > 0 ? ` · attempt ${connection.attempt}` : ''}`,
      }}
      statusItems={[
        { id: 'client', label: `Client ${status.status}`, tone: status.status === 'ready' ? 'success' : 'warning' },
        { id: 'capabilities', label: status.readyCapabilities.join(' · ') || 'none', tone: 'neutral' },
        { id: 'jobs', label: `${pending.length} in flight`, tone: pending.length > 0 ? 'info' : 'neutral' },
        { id: 'selected', label: selectedCorrelationId ? `Following ${selectedCorrelationId}` : 'Nothing followed', tone: selectedCorrelationId ? 'accent' : 'neutral' },
      ]}
      paletteItems={commands}
      onPaletteSelect={runCommand}
      paletteOpen={paletteOpen}
      onPaletteOpenChange={setPaletteOpen}
      paletteQuery={paletteQuery}
      onPaletteQueryChange={setPaletteQuery}
      inspector={
        <div className="grid content-start gap-4 p-4">
          <Card header="Add to the queue">
            <div className="grid gap-3">
              <FormControl id="panel-query" label="Search or paste a URL">
                <TextField
                  id="panel-query"
                  value={query}
                  onChange={setQuery}
                  placeholder="artist — track, or a YouTube link"
                  disabled={!player.connected}
                />
              </FormControl>
              <Button
                variant="primary"
                disabled={!query.trim() || !player.connected}
                onClick={() => {
                  void submit('play:query', { query: query.trim() })
                  setQuery('')
                  queryRef.current?.focus()
                }}
              >
                Queue it
              </Button>
              <FormControl id="panel-station" label="Radio station">
                <SelectField
                  id="panel-station"
                  value={station}
                  onChange={setStation}
                  options={STATIONS.map((item) => ({ value: item.key, label: item.name }))}
                />
              </FormControl>
              <Button disabled={!player.connected} onClick={() => void submit('play:radio', { station })}>
                Start station
              </Button>
            </div>
          </Card>

          <LinkedRecords bundle={selected} />

          <Card header="Plugins">
            <div className="grid gap-3">
              {(readModel?.plugins ?? []).map((plugin) => (
                <FormControl
                  key={plugin.name}
                  id={`plugin-${plugin.name}`}
                  label={plugin.name}
                  description={plugin.description}
                >
                  <ToggleField
                    id={`plugin-${plugin.name}`}
                    checked={plugin.enabled}
                    disabled={busy}
                    onChange={(enabled) => void submit('plugin:toggle', { plugin: plugin.name, enabled })}
                  />
                </FormControl>
              ))}
              {readModel?.plugins.length === 0 ? <EmptyState title="No plugins installed" /> : null}
            </div>
          </Card>

          <Card header="Activity">
            {readModel?.audit.length ? (
              <ol className="m-0 grid list-none gap-2 p-0">
                {readModel.audit.map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <code className="text-xs">{row.action}</code>
                    <span className="text-xs text-tint-muted">
                      {row.actor} · {formatAge(row.time)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="Nothing recorded yet" />
            )}
          </Card>
        </div>
      }
      drawer={
        <div className="grid gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-tint-muted">Poll scenario</span>
            {REALTIME_SCENARIOS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={scenario === item.id ? 'primary' : 'secondary'}
                onClick={() => {
                  setScenario(item.id)
                  host.setRealtimeScenario(item.id)
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => operations.clearSettled()}>
              Clear settled
            </Button>
          </div>
          <OperationLog operations={operationSnapshot.operations} onCancel={(id) => operations.cancel(id)} />
        </div>
      }
    />
  )
}

function NowPlaying({
  player,
  busy,
  volume,
  onVolumeChange,
  onVolumeCommit,
  onCommand,
}: {
  player: PlayerSnapshot
  busy: boolean
  volume: number
  onVolumeChange: (value: number) => void
  onVolumeCommit: (value: number) => void
  onCommand: (name: PanelCommandName) => void
}) {
  const eyebrow = !player.connected
    ? 'NOT CONNECTED'
    : player.busy
      ? 'PREPARING YOUR MUSIC'
      : !player.current
        ? 'READY WHEN YOU ARE'
        : player.paused
          ? 'PAUSED'
          : 'NOW PLAYING'

  return (
    <Surface className="grid gap-3 p-4">
      <p className="m-0 text-xs uppercase tracking-wide text-tint-muted">{eyebrow}</p>
      {player.current ? (
        <>
          <div>
            <p className="m-0 text-lg font-medium">{player.current.title}</p>
            <p className="m-0 text-sm text-tint-muted">
              {player.current.author} · {player.current.source}
            </p>
          </div>
          <ProgressBar
            value={player.current.length > 0 ? Math.round((player.position / player.current.length) * 100) : 0}
            label={
              player.current.length > 0
                ? `${formatDuration(player.position)} / ${formatDuration(player.current.length)}`
                : 'Live stream'
            }
          />
        </>
      ) : (
        <EmptyState title="Nothing is playing" description="Queue a track or start a radio station." />
      )}
      {player.notice ? <p className="m-0 text-sm text-tint-muted">{player.notice}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={busy || !player.connected}
            onClick={() => onCommand(player.paused ? 'player:resume' : 'player:pause')}
          >
            {player.paused ? 'Resume' : 'Pause'}
          </Button>
          <Button disabled={busy || !player.current} onClick={() => onCommand('player:skip')}>
            Skip
          </Button>
          <Button variant="danger" disabled={busy || !player.current} onClick={() => onCommand('player:stop')}>
            Stop
          </Button>
        </div>
        {/*
          Volume commits on release rather than on every drag frame, so one
          gesture is one operation instead of forty.
        */}
        <div className="flex min-w-56 items-end gap-2">
          <FormControl id="panel-volume" label={`Volume · ${volume}%`} className="flex-1">
            <SliderField
              id="panel-volume"
              value={volume}
              min={0}
              max={100}
              step={1}
              disabled={busy || !player.connected}
              onChange={onVolumeChange}
            />
          </FormControl>
          <Button
            size="sm"
            disabled={busy || !player.connected || volume === player.volume}
            onClick={() => onVolumeCommit(volume)}
          >
            Apply
          </Button>
        </div>
      </div>
    </Surface>
  )
}

function OperationLog({
  operations,
  onCancel,
}: {
  operations: readonly TintOperation[]
  onCancel: (id: string) => void
}) {
  if (operations.length === 0) {
    return (
      <p className="m-0 text-sm text-tint-muted">
        No commands submitted yet — every write goes through the operation seam.
      </p>
    )
  }
  return (
    <ol className="m-0 grid max-h-24 list-none gap-2 overflow-y-auto p-0" aria-label="Submitted operations">
      {operations.map((operation) => (
        <li key={operation.id} className="flex items-center gap-3 text-sm" data-testid="operation-row">
          <Badge tone={OPERATION_TONES[operation.state]}>{operation.state}</Badge>
          <code className="text-xs">{operation.name}</code>
          <span className="min-w-0 flex-1 truncate text-xs text-tint-muted">
            {operation.problem?.detail ?? operation.message ?? ''}
          </span>
          {operation.state === 'queued' || operation.state === 'running' ? (
            <Button size="sm" variant="ghost" onClick={() => onCancel(operation.id)}>
              Cancel
            </Button>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
