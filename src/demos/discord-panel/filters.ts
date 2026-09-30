import { commandLabel } from './correlation'
import type { SlashInteraction } from './types'

export type InteractionFilters = {
  command: string
  status: string
  agent: string
  channel: string
  text: string
}

export const EMPTY_FILTERS: InteractionFilters = { command: 'all', status: 'all', agent: 'all', channel: 'all', text: '' }

export function filterInteractions(interactions: readonly SlashInteraction[], filters: InteractionFilters): readonly SlashInteraction[] {
  const term = filters.text.trim().toLowerCase()
  return interactions.filter((interaction) => {
    if (filters.command !== 'all' && commandLabel(interaction) !== filters.command) return false
    if (filters.status !== 'all' && interaction.status !== filters.status) return false
    if (filters.agent !== 'all' && (interaction.agent ?? 'inline') !== filters.agent) return false
    if (filters.channel !== 'all' && interaction.channel !== filters.channel) return false
    if (term === '') return true
    return interaction.correlationId.toLowerCase().includes(term) ||
      interaction.actor.toLowerCase().includes(term) || interaction.summary.toLowerCase().includes(term) ||
      commandLabel(interaction).toLowerCase().includes(term) ||
      Object.values(interaction.options).some((value) => String(value).toLowerCase().includes(term))
  })
}
