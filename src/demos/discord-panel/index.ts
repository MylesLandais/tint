/**
 * The shared Discord panel kit.
 *
 * Both `discord-bot-panel` and `discord-mod-panel` are assembled from this:
 * one domain, one correlation engine, one view template. Neither panel owns a
 * copy of any of it.
 */
export type {
  ConversationTurn,
  CorrelatedAuditRow,
  CorrelationBundle,
  InteractionOptionValue,
  InteractionStatus,
  ModerationEvent,
  ModerationEventKind,
  SlashInteraction,
} from './types'
export { EPOCH_SECONDS } from './types'

export {
  buildCorrelationIndex,
  bundleFor,
  commandLabel,
  commandRollups,
  conversationFromTrace,
  pearson,
  phiCoefficient,
  runCorrelations,
  MIN_COEFFICIENT,
  MIN_SAMPLE,
} from './correlation'
export type { CommandRollup, CorrelationFinding, CorrelationSources } from './correlation'

export {
  createTraffic,
  formatMs,
  formatTickAge,
  generateTraffic,
  NEBULA_GUILD_ID,
  PANEL_GUILDS,
  SIGNED_IN_USER,
} from './fixtures'
export type { GeneratedTraffic, PanelGuild } from './fixtures'

export { PanelTemplate, connectionTone } from './PanelTemplate'
export type { PanelTemplateProps } from './PanelTemplate'

export {
  CommandRollupTable,
  CorrelationFindings,
  EMPTY_FILTERS,
  filterInteractions,
  GuildActivityFeed,
  InteractionFeed,
  InteractionFilterBar,
  InteractionMetrics,
} from './CorrelationViews'
export type { InteractionFilters } from './CorrelationViews'

export { ConversationTranscript, ConversationTraceView, LinkedRecords } from './ConversationTrace'
