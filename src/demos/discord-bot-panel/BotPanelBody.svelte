<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { buildCorrelationIndex, bundleFor, runCorrelations } from '../discord-panel/correlation'
  import { createTraffic, PANEL_GUILDS } from '../discord-panel/fixtures'
  import { EMPTY_FILTERS, filterInteractions, type InteractionFilters } from '../discord-panel/filters'
  import type { CommandPaletteItem, StatusItem } from '../../svelte/components/shell/types'
  import type { TintOperation } from '../../client/types'
  import { useCapability, useClientStatus, useConnection, useOperations } from '../../svelte/client/snapshots'
  import { useTintClient } from '../../svelte/client/context'
  import { useToast } from '../../svelte/components/toast/context'
  import MetricCard from '../../svelte/components/charts/MetricCard.svelte'
  import TimeSeriesChart from '../../svelte/components/charts/TimeSeriesChart.svelte'
  import ProgressBar from '../../svelte/components/progress/ProgressBar.svelte'
  import ErrorBanner from '../../svelte/components/shell/ErrorBanner.svelte'
  import PanelTemplate from '../discord-panel/PanelTemplate.svelte'
  import InteractionFilterBar from '../discord-panel/InteractionFilterBar.svelte'
  import InteractionFeed from '../discord-panel/InteractionFeed.svelte'
  import InteractionMetrics from '../discord-panel/InteractionMetrics.svelte'
  import CorrelationFindings from '../discord-panel/CorrelationFindings.svelte'
  import CommandRollupTable from '../discord-panel/CommandRollupTable.svelte'
  import ConversationTraceView from '../discord-panel/ConversationTraceView.svelte'
  import LinkedRecords from '../discord-panel/LinkedRecords.svelte'
  import { GUILDS, SIGNED_IN_USER, STATIONS, formatAge, formatDuration, type PlayerSnapshot } from './fixtures'
  import { deriveLiveInteractions, type LiveInteractionContext } from './liveInteractions'
  import type { GuildReadModel, LudisHost, PanelCommandInput, PanelCommandName, RealtimeScenario } from './adapters'

  let { host }: { host: LudisHost } = $props()
  const client = useTintClient()
  const statusSource = useClientStatus()
  const connectionSource = useConnection()
  const playerSource = useCapability<PlayerSnapshot>('guildPlayer')
  const operationSource = useOperations()
  const toast = useToast()
  const operations = operationSource.client
  const recordedTraffic = createTraffic()
  const contexts = new Map<string, LiveInteractionContext>()
  let contextRevision = $state(0)
  let playerRevision = $state(0)
  let guildId = $state(GUILDS[0]!.id)
  let readModel = $state<GuildReadModel | null>(null)
  let query = $state('')
  let station = $state(STATIONS[0]!.key)
  let volume = $state(playerSource.snapshot.volume)
  let paletteOpen = $state(false)
  let paletteQuery = $state('')
  let scenario = $state<RealtimeScenario>('healthy')
  let queueDepth = $state<{ tick: number; depth: number }[]>([])
  let dismissedError = $state<string | null>(null)
  let activeTab = $state('player')
  let filters = $state<InteractionFilters>({ ...EMPTY_FILTERS })
  let selectedCorrelationId = $state<string | null>(null)
  let hasRun = $state(false)

  let status = $derived(statusSource.snapshot)
  let connection = $derived(connectionSource.snapshot)
  let player = $derived.by(() => { void playerRevision; const snapshot = playerSource.snapshot; return { ...snapshot, queue: [...snapshot.queue] } })
  let operationSnapshot = $derived(operationSource.snapshot)
  let pending = $derived(operationSnapshot.operations.filter((operation) => operation.state === 'queued' || operation.state === 'running'))
  let busy = $derived(pending.length > 0 || player.busy)
  let guild = $derived(GUILDS.find((item) => item.id === guildId)!)
  let live = $derived.by(() => { void contextRevision; return deriveLiveInteractions(operationSnapshot.operations, contexts) })
  let combined = $derived({
    interactions: [...live.interactions, ...(recordedTraffic[guildId]?.interactions ?? [])],
    traces: [...live.traces, ...(recordedTraffic[guildId]?.traces ?? [])],
    moderation: recordedTraffic[guildId]?.moderation ?? [],
    audit: recordedTraffic[guildId]?.audit ?? [],
  })
  let bundles = $derived(buildCorrelationIndex(combined))
  let visible = $derived(filterInteractions(combined.interactions, filters))
  let selected = $derived(bundleFor(bundles, selectedCorrelationId))
  let findings = $derived(hasRun ? runCorrelations(bundles.filter((bundle) => new Set(visible.map((item) => item.correlationId)).has(bundle.correlationId))) : [])
  let settledVisible = $derived(visible.filter((item) => item.status === 'replied' || item.status === 'failed').length)
  let playerError = $derived(player.error && player.error !== dismissedError ? player.error : null)
  let statusItems = $derived<StatusItem[]>([
    { id: 'client', label: `Client ${status.status}`, tone: status.status === 'ready' ? 'success' : 'warning' },
    { id: 'capabilities', label: status.readyCapabilities.join(' · ') || 'none', tone: 'neutral' },
    { id: 'jobs', label: `${pending.length} in flight`, tone: pending.length ? 'info' : 'neutral' },
    { id: 'selected', label: selectedCorrelationId ? `Following ${selectedCorrelationId}` : 'Nothing followed', tone: selectedCorrelationId ? 'accent' : 'neutral' },
  ])
  let panelConnection = $derived({
    state: connection.state === 'online' ? 'connected' as const : connection.state === 'offline' ? 'disconnected' as const : 'connecting' as const,
    label: `Poll ${connection.state}${connection.attempt > 0 ? ` · attempt ${connection.attempt}` : ''}`,
  })
  let commands = $derived<CommandPaletteItem[]>([
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
    ...GUILDS.filter((item) => item.id !== guildId).map((item) => ({ id: `guild:${item.id}`, label: `Switch to ${item.name}`, group: 'Guilds' })),
  ])
  const tabs = [
    { id: 'player', label: 'Player' }, { id: 'commands', label: 'Slash commands' },
    { id: 'correlations', label: 'Correlations' }, { id: 'trace', label: 'Agent trace' },
  ]

  $effect(() => { host.guildPlayer.setGuild(guildId) })
  $effect(() => { volume = player.volume })
  $effect(() => {
    const depth = player.queue.length
    void player.position
    const previous = untrack(() => queueDepth)
    queueDepth = [...previous, { tick: previous.length, depth }].slice(-24)
  })
  $effect(() => {
    const id = guildId
    const settled = operationSnapshot.operations.length - pending.length
    void settled
    let active = true
    void client.request.send<GuildReadModel>({ method: 'GET', url: `/guild/${id}` }).then((response) => {
      if (active) readModel = response.data
    }).catch(() => undefined)
    return () => { active = false }
  })

  onMount(() => {
    const unsubscribePlayer = host.guildPlayer.subscribe?.(() => { playerRevision += 1 }) ?? (() => undefined)
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.matches('input, textarea, select, [contenteditable="true"]')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); paletteOpen = !paletteOpen; return }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === ' ') { event.preventDefault(); runCommand(player.paused ? 'player:resume' : 'player:pause') }
      else if (event.key.toLowerCase() === 'n') runCommand('player:skip')
      else if (event.key === '[') runCommand('volume:down')
      else if (event.key === ']') runCommand('volume:up')
    }
    window.addEventListener('keydown', onKeydown)
    return () => { unsubscribePlayer(); window.removeEventListener('keydown', onKeydown) }
  })

  function submit(name: PanelCommandName, input: Omit<PanelCommandInput, 'guildId'> = {}) {
    const handle = operations.submit({ name, input: { guildId, ...input }, idempotencyKey: `${name}:${guildId}:${JSON.stringify(input)}:${Date.now()}` })
    contexts.set(handle.id, { guildId, channel: player.channel ?? 'general', actor: SIGNED_IN_USER, options: input as Record<string, string | number | boolean> })
    contextRevision += 1
    void handle.settled.then((operation) => {
      toast.push({ title: operation.state === 'succeeded' ? `${operation.name} applied` : `${operation.name} ${operation.state}`,
        description: operation.problem?.detail ?? operation.message,
        tone: operation.state === 'succeeded' ? 'success' : operation.state === 'failed' ? 'danger' : 'info' })
    })
    return handle
  }

  function runCommand(id: string) {
    paletteOpen = false
    paletteQuery = ''
    if (id.startsWith('guild:')) { guildId = id.slice(6); return }
    if (id.startsWith('view:')) { activeTab = id.slice(5); if (activeTab === 'correlations') hasRun = true; return }
    if (id.startsWith('radio:')) { void submit('play:radio', { station: id.slice(6) }); return }
    if (id === 'volume:up') { void submit('player:volume', { level: Math.min(100, volume + 5) }); return }
    if (id === 'volume:down') { void submit('player:volume', { level: Math.max(0, volume - 5) }); return }
    void submit(id as PanelCommandName)
  }
  function follow(id: string) { selectedCorrelationId = id; activeTab = 'trace' }
  function queueQuery() { if (!query.trim()) return; void submit('play:query', { query: query.trim() }); query = '' }
  function eyebrow() { return !player.connected ? 'NOT CONNECTED' : player.busy ? 'PREPARING YOUR MUSIC' : !player.current ? 'READY WHEN YOU ARE' : player.paused ? 'PAUSED' : 'NOW PLAYING' }
  function operationTone(state: TintOperation['state']) { return state === 'succeeded' ? 'text-tint-success' : state === 'failed' ? 'text-tint-danger' : state === 'running' ? 'text-tint-info' : 'text-tint-muted' }
</script>

<PanelTemplate product="Ludis" productSubtitle="Bot control" signedInAs={SIGNED_IN_USER} guilds={PANEL_GUILDS} {guildId}
  onGuildChange={(id) => { guildId = id }} {tabs} {activeTab} onActiveTabChange={(id) => { activeTab = id }}
  connection={panelConnection} {statusItems} paletteItems={commands} onPaletteSelect={runCommand} {paletteOpen}
  onPaletteOpenChange={(open) => { paletteOpen = open }} {paletteQuery} onPaletteQueryChange={(value) => { paletteQuery = value }}>
  {#snippet banner()}
    {#if status.failedCapabilities[0]}<ErrorBanner title={`The ${status.failedCapabilities[0]} capability failed to start`} detail={status.problem?.detail}>
      {#snippet actions()}<button type="button" onclick={() => void client.restart(status.failedCapabilities[0])}>Retry {status.failedCapabilities[0]}</button>{/snippet}
    </ErrorBanner>{/if}
    {#if playerError}<ErrorBanner title="The last command failed" detail={playerError} onDismiss={() => { dismissedError = playerError }} />{/if}
  {/snippet}
  {#snippet content(tabId)}
    {#if tabId === 'player'}
      <div class="grid min-w-0 gap-4">
        <section class="card grid gap-3 p-4"><p class="m-0 text-xs uppercase tracking-wide text-tint-muted">{eyebrow()}</p>
          {#if player.current}<div><p class="m-0 text-lg font-medium">{player.current.title}</p><p class="m-0 text-sm text-tint-muted">{player.current.author} · {player.current.source}</p></div>
            <ProgressBar value={player.current.length > 0 ? Math.round(player.position / player.current.length * 100) : 0} label={player.current.length > 0 ? `${formatDuration(player.position)} / ${formatDuration(player.current.length)}` : 'Live stream'} />
          {:else}<p class="text-sm text-tint-muted">Nothing is playing. Queue a track or start a radio station.</p>{/if}
          {#if player.notice}<p class="m-0 text-sm text-tint-muted">{player.notice}</p>{/if}
          <div class="flex flex-wrap items-end justify-between gap-4"><div class="flex flex-wrap gap-2">
            <button type="button" disabled={busy || !player.connected} onclick={() => void submit(player.paused ? 'player:resume' : 'player:pause')} class="button primary">{player.paused ? 'Resume' : 'Pause'}</button>
            <button type="button" disabled={busy || !player.current} onclick={() => void submit('player:skip')} class="button">Skip</button>
            <button type="button" disabled={busy || !player.current} onclick={() => void submit('player:stop')} class="button danger">Stop</button></div>
            <div class="flex min-w-56 items-end gap-2"><label class="field flex-1">Volume · {volume}%<input type="range" value={volume} min="0" max="100" step="1" disabled={busy || !player.connected} oninput={(event) => { volume = Number(event.currentTarget.value) }} /></label><button type="button" disabled={busy || !player.connected || volume === player.volume} onclick={() => void submit('player:volume', { level: volume })} class="button">Apply</button></div>
          </div>
        </section>
        <section class="card"><header><h2>Up next</h2><span>{player.queue.length} / {player.queueLimit}</span></header><div class="overflow-x-auto p-4"><table aria-label={`Queue for ${guild.name}`} class="w-full min-w-[32rem] text-left text-xs"><thead><tr><th>Track</th><th>Artist</th><th>Source</th><th>Length</th><th>Requested by</th><th>State</th></tr></thead><tbody>{#each player.queue as row (row.id)}<tr><th scope="row">{row.title}</th><td>{row.author}</td><td><code>{row.source}</code></td><td>{formatDuration(row.length)}</td><td>{row.requester}</td><td>{row.state}</td></tr>{:else}<tr><td colspan="6">The queue is empty</td></tr>{/each}</tbody></table></div></section>
        <div class="grid gap-3 @xl:grid-cols-3"><MetricCard label="Queue depth" value={String(player.queue.length)} hint={`Cap ${player.queueLimit}`} tone="accent" /><MetricCard label="Volume" value={`${player.volume}%`} hint={player.paused ? 'Paused' : 'Playing'} /><MetricCard label="In flight" value={String(pending.length)} hint={pending[0]?.name ?? 'Idle'} /></div>
        <section class="card"><header><h2>Queue depth over time</h2></header><div class="p-4"><TimeSeriesChart data={queueDepth.map((point) => ({ tick: `t${point.tick}`, depth: point.depth }))} series={[{ key: 'depth', label: 'Queued tracks' }]} xKey="tick" height={160} /></div></section>
      </div>
    {:else if tabId === 'commands'}
      <div class="grid min-w-0 gap-4"><InteractionFilterBar interactions={combined.interactions} {filters} onFiltersChange={(next) => { filters = next }} /><InteractionMetrics interactions={visible} /><section class="card"><header><h2>Interactions</h2><span>{visible.length} shown</span></header><div class="p-4"><InteractionFeed interactions={visible} selectedId={selectedCorrelationId} onSelect={follow} /></div></section></div>
    {:else if tabId === 'correlations'}
      <div class="grid min-w-0 gap-4"><InteractionFilterBar interactions={combined.interactions} {filters} onFiltersChange={(next) => { filters = next }} /><CorrelationFindings {findings} {hasRun} sampleSize={settledVisible} onRun={() => { hasRun = true }} /><section class="card"><header><h2>By command</h2></header><div class="p-4"><CommandRollupTable interactions={visible} /></div></section></div>
    {:else if tabId === 'trace'}<ConversationTraceView bundle={selected} />{/if}
  {/snippet}
  {#snippet inspector()}
    <div class="grid content-start gap-4 p-4">
      <section class="card"><header><h2>Add to the queue</h2></header><div class="grid gap-3 p-4"><label class="field">Search or paste a URL<input value={query} oninput={(event) => { query = event.currentTarget.value }} placeholder="artist — track, or a YouTube link" disabled={!player.connected} /></label><button type="button" class="button primary" disabled={!query.trim() || !player.connected} onclick={queueQuery}>Queue it</button><label class="field">Radio station<select value={station} onchange={(event) => { station = event.currentTarget.value }}>{#each STATIONS as item}<option value={item.key}>{item.name}</option>{/each}</select></label><button type="button" class="button" disabled={!player.connected} onclick={() => void submit('play:radio', { station })}>Start station</button></div></section>
      <LinkedRecords bundle={selected} />
      <section class="card"><header><h2>Plugins</h2></header><div class="grid gap-3 p-4">
        {#each readModel?.plugins ?? [] as plugin (plugin.name)}<label class="grid gap-1 text-sm"><span>{plugin.name}</span><small class="text-tint-muted">{plugin.description}</small><input type="checkbox" checked={plugin.enabled} disabled={busy} onchange={(event) => void submit('plugin:toggle', { plugin: plugin.name, enabled: event.currentTarget.checked })} /></label>
        {:else}<p class="text-sm text-tint-muted">No plugins installed</p>{/each}
      </div></section>
      <section class="card"><header><h2>Activity</h2></header><ol class="m-0 grid list-none gap-2 p-4">{#each readModel?.audit ?? [] as row (row.id)}<li class="flex items-baseline justify-between gap-3 text-sm"><code class="text-xs">{row.action}</code><small class="text-tint-muted">{row.actor} · {formatAge(row.time)}</small></li>{:else}<li class="text-sm text-tint-muted">Nothing recorded yet</li>{/each}</ol></section>
    </div>
  {/snippet}
  {#snippet drawer()}
    <div class="grid gap-3 p-4"><div class="flex flex-wrap items-center gap-2"><span class="text-xs uppercase tracking-wide text-tint-muted">Poll scenario</span>
      {#each ['healthy', 'flaky', 'offline'] as item}<button type="button" aria-pressed={scenario === item} onclick={() => { scenario = item as RealtimeScenario; host.setRealtimeScenario(scenario) }} class={['button', scenario === item && 'primary']}>{item[0]!.toUpperCase() + item.slice(1)}</button>{/each}
      <button type="button" class="button" onclick={() => operations.clearSettled()}>Clear settled</button></div>
      <ol aria-label="Submitted operations" class="m-0 grid max-h-24 list-none gap-2 overflow-y-auto p-0">
        {#each operationSnapshot.operations as operation (operation.id)}<li data-testid="operation-row" class="flex items-center gap-3 text-sm"><strong class={operationTone(operation.state)}>{operation.state}</strong><code class="text-xs">{operation.name}</code><span class="min-w-0 flex-1 truncate text-xs text-tint-muted">{operation.problem?.detail ?? operation.message ?? ''}</span>{#if operation.state === 'queued' || operation.state === 'running'}<button type="button" onclick={() => operations.cancel(operation.id)} class="button">Cancel</button>{/if}</li>
        {:else}<li class="text-sm text-tint-muted">No commands submitted yet — every write goes through the operation seam.</li>{/each}
      </ol>
    </div>
  {/snippet}
</PanelTemplate>

<style>
  .card { min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: .5rem; background: var(--tint-panel); }
  .card header { display: flex; justify-content: space-between; gap: .5rem; padding: .75rem 1rem; border-bottom: 1px solid var(--tint-border); }
  .card h2 { margin: 0; font-size: .875rem; }
  .card header span { color: var(--tint-muted); font-size: .75rem; }
  .button { border: 1px solid var(--tint-border); border-radius: .5rem; background: var(--tint-panel); padding: .4rem .75rem; color: var(--tint-ink); font-size: .75rem; cursor: pointer; }
  .button.primary { border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  .button.danger { border-color: var(--tint-danger); color: var(--tint-danger); }
  .button:disabled { cursor: not-allowed; opacity: .55; }
  .field { display: grid; gap: .3rem; color: var(--tint-muted); font-size: .75rem; }
  .field input:not([type="range"]), .field select { min-height: 2rem; min-width: 0; border: 1px solid var(--tint-border); border-radius: .4rem; background: var(--tint-panel); padding: .3rem .5rem; color: var(--tint-ink); }
  th, td { padding: .5rem; border-bottom: 1px solid var(--tint-border); }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
