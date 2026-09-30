/**
 * The shared Discord panel kit.
 *
 * Both `discord-bot-panel` and `discord-mod-panel` are assembled from this:
 * one domain, one correlation engine, one view template. Neither panel owns a
 * copy of any of it.
 */
import type { ComponentProps } from 'svelte'
import type PanelTemplateComponent from './PanelTemplate.svelte'
export type PanelTemplateProps = ComponentProps<typeof PanelTemplateComponent>

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

export { connectionTone } from './status'
export { EMPTY_FILTERS, filterInteractions } from './filters'
export type { InteractionFilters } from './filters'

export { default as PanelTemplate } from './PanelTemplate.svelte'
export { default as CommandRollupTable } from './CommandRollupTable.svelte'
export { default as CorrelationFindings } from './CorrelationFindings.svelte'
export { default as GuildActivityFeed } from './GuildActivityFeed.svelte'
export { default as InteractionFeed } from './InteractionFeed.svelte'
export { default as InteractionFilterBar } from './InteractionFilterBar.svelte'
export { default as InteractionMetrics } from './InteractionMetrics.svelte'
export { default as ConversationTranscript } from './ConversationTranscript.svelte'
export { default as ConversationTraceView } from './ConversationTraceView.svelte'
export { default as LinkedRecords } from './LinkedRecords.svelte'
