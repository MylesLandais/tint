<script lang="ts">
  import { buildCorrelationIndex, bundleFor, runCorrelations } from '../discord-panel/correlation'
  import { createTraffic, NEBULA_GUILD_ID, PANEL_GUILDS, SIGNED_IN_USER, type GeneratedTraffic } from '../discord-panel/fixtures'
  import { EMPTY_FILTERS, filterInteractions, type InteractionFilters } from '../discord-panel/filters'
  import { EMPTY_ACTIVITY, filterActivity, type ActivityFilters } from './model'
  import type { CommandPaletteItem, StatusItem } from '../../svelte/components/shell/types'
  import MetricCard from '../../svelte/components/charts/MetricCard.svelte'
  import PanelTemplate from '../discord-panel/PanelTemplate.svelte'
  import InteractionFilterBar from '../discord-panel/InteractionFilterBar.svelte'
  import InteractionFeed from '../discord-panel/InteractionFeed.svelte'
  import InteractionMetrics from '../discord-panel/InteractionMetrics.svelte'
  import GuildActivityFeed from '../discord-panel/GuildActivityFeed.svelte'
  import CorrelationFindings from '../discord-panel/CorrelationFindings.svelte'
  import CommandRollupTable from '../discord-panel/CommandRollupTable.svelte'
  import ConversationTraceView from '../discord-panel/ConversationTraceView.svelte'
  import LinkedRecords from '../discord-panel/LinkedRecords.svelte'

  let { traffic: injected }: { traffic?: GeneratedTraffic } = $props()
  const nebula = PANEL_GUILDS.find((guild) => guild.id === NEBULA_GUILD_ID)!
  const fixture = createTraffic()[NEBULA_GUILD_ID]!
  let traffic = $derived(injected ?? fixture)
  let activeTab = $state('activity')
  let filters = $state<InteractionFilters>({ ...EMPTY_FILTERS })
  let activityFilters = $state<ActivityFilters>({ ...EMPTY_ACTIVITY })
  let selectedCorrelationId = $state<string | null>(null)
  let hasRun = $state(false)
  let paletteOpen = $state(false)
  let paletteQuery = $state('')
  let bundles = $derived(buildCorrelationIndex(traffic))
  let visible = $derived(filterInteractions(traffic.interactions, filters))
  let selected = $derived(bundleFor(bundles, selectedCorrelationId))
  let activity = $derived([...filterActivity(traffic.moderation, activityFilters)].sort((a, b) => b.tick - a.tick))
  let findings = $derived(hasRun ? runCorrelations(bundles.filter((bundle) => new Set(visible.map((item) => item.correlationId)).has(bundle.correlationId))) : [])
  let automated = $derived(traffic.moderation.filter((event) => event.automated).length)
  let escalations = $derived(traffic.moderation.filter((event) => event.kind === 'agent.escalation').length)
  let settledVisible = $derived(visible.filter((item) => item.status === 'replied' || item.status === 'failed').length)
  let kinds = $derived([...new Set(traffic.moderation.map((event) => event.kind))].sort())
  let statusItems = $derived<StatusItem[]>([
    { id: 'events', label: `${traffic.moderation.length} events`, tone: 'neutral' },
    { id: 'automated', label: `${automated} automated`, tone: automated ? 'info' : 'neutral' },
    { id: 'escalations', label: `${escalations} escalations`, tone: escalations ? 'danger' : 'neutral' },
    { id: 'selected', label: selectedCorrelationId ? `Following ${selectedCorrelationId}` : 'Nothing followed', tone: selectedCorrelationId ? 'accent' : 'neutral' },
  ])
  let paletteItems = $derived<CommandPaletteItem[]>([
    { id: 'view:activity', label: 'Show guild activity', group: 'Views' },
    { id: 'view:commands', label: 'Show the slash command feed', group: 'Views' },
    { id: 'view:correlations', label: 'Run correlations', group: 'Views' },
    { id: 'view:trace', label: 'Follow the selected trace', group: 'Views', disabled: selectedCorrelationId === null },
    { id: 'filter:automated', label: 'Show only automated actions', group: 'Filters' },
    { id: 'filter:failed', label: 'Show only failed interactions', group: 'Filters' },
    { id: 'filter:reset', label: 'Clear every filter', group: 'Filters' },
  ])
  const tabs = [
    { id: 'activity', label: 'Guild activity' }, { id: 'commands', label: 'Slash commands' },
    { id: 'correlations', label: 'Correlations' }, { id: 'trace', label: 'Agent trace' },
  ]
  function follow(id: string) { selectedCorrelationId = id; activeTab = 'trace' }
  function paletteSelect(id: string) {
    paletteOpen = false
    paletteQuery = ''
    if (id.startsWith('view:')) { activeTab = id.slice(5); if (activeTab === 'correlations') hasRun = true }
    else if (id === 'filter:automated') { activeTab = 'activity'; activityFilters = { ...activityFilters, automatedOnly: true } }
    else if (id === 'filter:failed') { activeTab = 'commands'; filters = { ...filters, status: 'failed' } }
    else if (id === 'filter:reset') { filters = { ...EMPTY_FILTERS }; activityFilters = { ...EMPTY_ACTIVITY } }
  }
</script>

<PanelTemplate product="Nebula" productSubtitle="Moderation" signedInAs={SIGNED_IN_USER} guilds={PANEL_GUILDS}
  guildId={NEBULA_GUILD_ID} onGuildChange={() => undefined} guildSwitching={false} {tabs} {activeTab}
  onActiveTabChange={(id) => { activeTab = id }} connection={{ state: 'connected', label: 'Gateway connected' }} {statusItems}
  {paletteItems} onPaletteSelect={paletteSelect} {paletteOpen} onPaletteOpenChange={(open) => { paletteOpen = open }}
  {paletteQuery} onPaletteQueryChange={(query) => { paletteQuery = query }}>
  {#snippet content(tabId)}
    {#if tabId === 'activity'}
      <div class="grid min-w-0 gap-4">
        <div class="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
          <MetricCard label="Events" value={String(traffic.moderation.length)} hint="In the retained window" tone="accent" />
          <MetricCard label="Automated" value={String(automated)} hint="Taken by an agent" />
          <MetricCard label="Escalations" value={String(escalations)} hint={escalations ? 'Agent asked for a human' : 'None outstanding'} tone={escalations ? 'danger' : 'default'} />
          <MetricCard label="Channels" value={String(nebula.channels.length)} hint={nebula.channels.map((name) => `#${name}`).join(' ')} />
        </div>
        <div data-tint-filter-bar class="flex flex-wrap items-end gap-3 border-b border-tint-border bg-tint-panel p-3 text-xs">
          <label class="field">Channel<select value={activityFilters.channel} onchange={(event) => { activityFilters = { ...activityFilters, channel: event.currentTarget.value } }}><option value="all">Every channel</option>{#each nebula.channels as channel}<option value={channel}>#{channel}</option>{/each}</select></label>
          <label class="field">Event<select value={activityFilters.kind} onchange={(event) => { activityFilters = { ...activityFilters, kind: event.currentTarget.value } }}><option value="all">Every event</option>{#each kinds as kind}<option value={kind}>{kind}</option>{/each}</select></label>
          <label class="field">Automated only<input type="checkbox" checked={activityFilters.automatedOnly} onchange={(event) => { activityFilters = { ...activityFilters, automatedOnly: event.currentTarget.checked } }} /></label>
          <button type="button" disabled={JSON.stringify(activityFilters) === JSON.stringify(EMPTY_ACTIVITY)} onclick={() => { activityFilters = { ...EMPTY_ACTIVITY } }}>Reset</button>
        </div>
        <section class="card"><header><h2>Everything that happened</h2><span>{activity.length} shown</span></header><div class="p-4"><GuildActivityFeed events={activity} selectedId={selectedCorrelationId} onSelect={follow} /></div></section>
      </div>
    {:else if tabId === 'commands'}
      <div class="grid min-w-0 gap-4"><InteractionFilterBar interactions={traffic.interactions} {filters} onFiltersChange={(next) => { filters = next }} /><InteractionMetrics interactions={visible} />
        <section class="card"><header><h2>Interactions</h2><span>{visible.length} shown</span></header><div class="p-4"><InteractionFeed interactions={visible} selectedId={selectedCorrelationId} onSelect={follow} /></div></section></div>
    {:else if tabId === 'correlations'}
      <div class="grid min-w-0 gap-4"><InteractionFilterBar interactions={traffic.interactions} {filters} onFiltersChange={(next) => { filters = next }} />
        <CorrelationFindings {findings} {hasRun} sampleSize={settledVisible} onRun={() => { hasRun = true }} />
        <section class="card"><header><h2>By command</h2></header><div class="p-4"><CommandRollupTable interactions={visible} /></div></section></div>
    {:else if tabId === 'trace'}<ConversationTraceView bundle={selected} />{/if}
  {/snippet}
  {#snippet inspector()}<div class="grid content-start gap-4 p-4"><LinkedRecords bundle={selected} /><section class="card"><header><h2>Agents on duty</h2></header><ul class="m-0 grid list-none gap-2 p-4 text-sm"><li><strong>maya-agent</strong><small>Answers /ask from the guild archive.</small></li><li><strong>archivist</strong><small>Summarises channels and owns the search index.</small></li><li><strong>warden</strong><small>Policy checks, timeouts, and case files.</small></li></ul></section></div>{/snippet}
</PanelTemplate>

<style>
  .card { min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: .5rem; background: var(--tint-panel); }
  .card header { display: flex; justify-content: space-between; gap: .5rem; padding: .75rem 1rem; border-bottom: 1px solid var(--tint-border); }
  .card h2 { margin: 0; font-size: .875rem; }
  .card span, .card small { display: block; color: var(--tint-muted); font-size: .75rem; }
  .field { display: grid; gap: .3rem; }
  .field select { min-height: 2rem; border: 1px solid var(--tint-border); border-radius: .4rem; background: var(--tint-panel); color: var(--tint-ink); }
  button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
