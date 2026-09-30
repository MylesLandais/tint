/**
 * The system-nebula moderation panel.
 *
 * Same template, same correlation engine, different question. The bot panel
 * asks "what is the player doing"; this one asks "what happened in the guild,
 * and which of it was an agent's doing". Everything on screen is either a
 * moderation event or a slash command, and the two are joined on the same
 * correlation id, so an automated timeout leads straight to the agent turn
 * that decided on it.
 *
 * It is read-only on purpose. Acting on a case is a write that belongs behind
 * the operation seam, and inventing one here would be a button that lies.
 */
import { useCallback, useMemo, useState } from 'react'
import {
  buildCorrelationIndex,
  bundleFor,
  CommandRollupTable,
  ConversationTraceView,
  CorrelationFindings,
  createTraffic,
  EMPTY_FILTERS,
  filterInteractions,
  GuildActivityFeed,
  InteractionFeed,
  InteractionFilterBar,
  InteractionMetrics,
  LinkedRecords,
  NEBULA_GUILD_ID,
  PANEL_GUILDS,
  PanelTemplate,
  runCorrelations,
  SIGNED_IN_USER,
  type GeneratedTraffic,
  type InteractionFilters,
  type ModerationEvent,
} from '../discord-panel'
import type { CommandPaletteItem, WorkspaceTab } from '../../components/shell'
import { Card } from '../../components/surface'
import { MetricCard } from '../../components/charts'
import { FilterBar } from '../../components/shell'
import { FormControl, SelectField, ToggleField } from '../../components/form'
import { Button } from '../../components/button'

const NEBULA = PANEL_GUILDS.find((guild) => guild.id === NEBULA_GUILD_ID)!

export type ModPanelProps = {
  /** Injected by the test so it does not depend on the generated volume. */
  traffic?: GeneratedTraffic
}

type ActivityFilters = { channel: string; kind: string; automatedOnly: boolean }

const EMPTY_ACTIVITY: ActivityFilters = { channel: 'all', kind: 'all', automatedOnly: false }

/** Exported for the test: the activity list is the panel's headline surface. */
export function filterActivity(
  events: readonly ModerationEvent[],
  filters: ActivityFilters,
): readonly ModerationEvent[] {
  return events.filter((event) => {
    if (filters.channel !== 'all' && event.channel !== filters.channel) return false
    if (filters.kind !== 'all' && event.kind !== filters.kind) return false
    if (filters.automatedOnly && !event.automated) return false
    return true
  })
}

export function ModPanel({ traffic: injected }: ModPanelProps = {}) {
  const traffic = useMemo(() => injected ?? createTraffic()[NEBULA_GUILD_ID]!, [injected])

  const [activeTab, setActiveTab] = useState('activity')
  const [filters, setFilters] = useState<InteractionFilters>(EMPTY_FILTERS)
  const [activityFilters, setActivityFilters] = useState<ActivityFilters>(EMPTY_ACTIVITY)
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')

  const bundles = useMemo(() => buildCorrelationIndex(traffic), [traffic])
  const visible = useMemo(() => filterInteractions(traffic.interactions, filters), [traffic.interactions, filters])
  const selected = bundleFor(bundles, selectedCorrelationId)

  const activity = useMemo(
    () => [...filterActivity(traffic.moderation, activityFilters)].sort((left, right) => right.tick - left.tick),
    [traffic.moderation, activityFilters],
  )

  const findings = useMemo(() => {
    if (!hasRun) return []
    const visibleIds = new Set(visible.map((item) => item.correlationId))
    return runCorrelations(bundles.filter((bundle) => visibleIds.has(bundle.correlationId)))
  }, [hasRun, bundles, visible])

  const follow = useCallback((correlationId: string) => {
    setSelectedCorrelationId(correlationId)
    setActiveTab('trace')
  }, [])

  const automated = traffic.moderation.filter((event) => event.automated).length
  const escalations = traffic.moderation.filter((event) => event.kind === 'agent.escalation').length
  const settledVisible = visible.filter((item) => item.status === 'replied' || item.status === 'failed').length
  const kinds = useMemo(() => [...new Set(traffic.moderation.map((event) => event.kind))].sort(), [traffic.moderation])

  const paletteItems: readonly CommandPaletteItem[] = [
    { id: 'view:activity', label: 'Show guild activity', group: 'Views' },
    { id: 'view:commands', label: 'Show the slash command feed', group: 'Views' },
    { id: 'view:correlations', label: 'Run correlations', group: 'Views' },
    { id: 'view:trace', label: 'Follow the selected trace', group: 'Views', disabled: selectedCorrelationId === null },
    { id: 'filter:automated', label: 'Show only automated actions', group: 'Filters' },
    { id: 'filter:failed', label: 'Show only failed interactions', group: 'Filters' },
    { id: 'filter:reset', label: 'Clear every filter', group: 'Filters' },
  ]

  const onPaletteSelect = useCallback((id: string) => {
    setPaletteOpen(false)
    setPaletteQuery('')
    if (id.startsWith('view:')) {
      const view = id.slice('view:'.length)
      setActiveTab(view)
      if (view === 'correlations') setHasRun(true)
      return
    }
    if (id === 'filter:automated') {
      setActiveTab('activity')
      setActivityFilters((current) => ({ ...current, automatedOnly: true }))
      return
    }
    if (id === 'filter:failed') {
      setActiveTab('commands')
      setFilters((current) => ({ ...current, status: 'failed' }))
      return
    }
    if (id === 'filter:reset') {
      setFilters(EMPTY_FILTERS)
      setActivityFilters(EMPTY_ACTIVITY)
    }
  }, [])

  const tabs: readonly WorkspaceTab[] = [
    {
      id: 'activity',
      label: 'Guild activity',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Events" value={String(traffic.moderation.length)} hint="In the retained window" tone="accent" />
            <MetricCard label="Automated" value={String(automated)} hint="Taken by an agent" />
            <MetricCard
              label="Escalations"
              value={String(escalations)}
              hint={escalations > 0 ? 'Agent asked for a human' : 'None outstanding'}
              tone={escalations > 0 ? 'danger' : 'default'}
            />
            <MetricCard label="Channels" value={String(NEBULA.channels.length)} hint={NEBULA.channels.map((name) => `#${name}`).join(' ')} />
          </div>

          <FilterBar
            actions={
              <Button
                size="sm"
                variant="ghost"
                disabled={JSON.stringify(activityFilters) === JSON.stringify(EMPTY_ACTIVITY)}
                onClick={() => setActivityFilters(EMPTY_ACTIVITY)}
              >
                Reset
              </Button>
            }
          >
            <FormControl id="activity-channel" label="Channel">
              <SelectField
                id="activity-channel"
                value={activityFilters.channel}
                onChange={(channel) => setActivityFilters((current) => ({ ...current, channel }))}
                options={[
                  { value: 'all', label: 'Every channel' },
                  ...NEBULA.channels.map((name) => ({ value: name, label: `#${name}` })),
                ]}
              />
            </FormControl>
            <FormControl id="activity-kind" label="Event">
              <SelectField
                id="activity-kind"
                value={activityFilters.kind}
                onChange={(kind) => setActivityFilters((current) => ({ ...current, kind }))}
                options={[{ value: 'all', label: 'Every event' }, ...kinds.map((value) => ({ value, label: value }))]}
              />
            </FormControl>
            <FormControl id="activity-automated" label="Automated only">
              <ToggleField
                id="activity-automated"
                checked={activityFilters.automatedOnly}
                onChange={(automatedOnly) => setActivityFilters((current) => ({ ...current, automatedOnly }))}
              />
            </FormControl>
          </FilterBar>

          <Card header="Everything that happened" actions={<span className="text-xs text-tint-muted">{activity.length} shown</span>}>
            <GuildActivityFeed events={activity} onSelect={follow} selectedId={selectedCorrelationId} />
          </Card>
        </div>
      ),
    },
    {
      id: 'commands',
      label: 'Slash commands',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <InteractionFilterBar interactions={traffic.interactions} filters={filters} onFiltersChange={setFilters} />
          <InteractionMetrics interactions={visible} />
          <Card header="Interactions" actions={<span className="text-xs text-tint-muted">{visible.length} shown</span>}>
            <InteractionFeed interactions={visible} selectedId={selectedCorrelationId} onSelect={follow} />
          </Card>
        </div>
      ),
    },
    {
      id: 'correlations',
      label: 'Correlations',
      content: (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <InteractionFilterBar interactions={traffic.interactions} filters={filters} onFiltersChange={setFilters} />
          <CorrelationFindings findings={findings} hasRun={hasRun} sampleSize={settledVisible} onRun={() => setHasRun(true)} />
          <Card header="By command">
            <CommandRollupTable interactions={visible} />
          </Card>
        </div>
      ),
    },
    {
      id: 'trace',
      label: 'Agent trace',
      // Mounted only while open — the service map pulls in the graph engine.
      content: activeTab === 'trace' ? <ConversationTraceView bundle={selected} /> : null,
    },
  ]

  return (
    <PanelTemplate
      product="Nebula"
      productSubtitle="Moderation"
      signedInAs={SIGNED_IN_USER}
      guilds={PANEL_GUILDS}
      guildId={NEBULA_GUILD_ID}
      onGuildChange={() => undefined}
      // This panel is the system-nebula view. Offering the other guilds in the
      // rail and then ignoring the click would be worse than disabling them.
      guildSwitching={false}
      tabs={tabs}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      connection={{ state: 'connected', label: 'Gateway connected' }}
      statusItems={[
        { id: 'events', label: `${traffic.moderation.length} events`, tone: 'neutral' },
        { id: 'automated', label: `${automated} automated`, tone: automated > 0 ? 'info' : 'neutral' },
        { id: 'escalations', label: `${escalations} escalations`, tone: escalations > 0 ? 'danger' : 'neutral' },
        {
          id: 'selected',
          label: selectedCorrelationId ? `Following ${selectedCorrelationId}` : 'Nothing followed',
          tone: selectedCorrelationId ? 'accent' : 'neutral',
        },
      ]}
      paletteItems={paletteItems}
      onPaletteSelect={onPaletteSelect}
      paletteOpen={paletteOpen}
      onPaletteOpenChange={setPaletteOpen}
      paletteQuery={paletteQuery}
      onPaletteQueryChange={setPaletteQuery}
      inspector={
        <div className="grid content-start gap-4 p-4">
          <LinkedRecords bundle={selected} />
          <Card header="Agents on duty">
            <ul className="m-0 grid list-none gap-2 p-0 text-sm">
              <li>
                <span className="font-medium">maya-agent</span>
                <span className="block text-xs text-tint-muted">Answers /ask from the guild archive.</span>
              </li>
              <li>
                <span className="font-medium">archivist</span>
                <span className="block text-xs text-tint-muted">Summarises channels and owns the search index.</span>
              </li>
              <li>
                <span className="font-medium">warden</span>
                <span className="block text-xs text-tint-muted">Policy checks, timeouts, and case files.</span>
              </li>
            </ul>
          </Card>
        </div>
      }
    />
  )
}
