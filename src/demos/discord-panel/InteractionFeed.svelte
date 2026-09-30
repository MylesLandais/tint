<script lang="ts">
  import { commandLabel } from './correlation'
  import { formatMs, formatTickAge } from './fixtures'
  import type { SlashInteraction } from './types'
  let { interactions, selectedId, onSelect }: { interactions: readonly SlashInteraction[]; selectedId: string | null; onSelect: (id: string) => void } = $props()
</script>

<div class="overflow-x-auto">
  <table aria-label="Slash command interactions" class="w-full min-w-[44rem] border-collapse text-left text-xs">
    <thead><tr><th>Command</th><th>Invoked by</th><th>Channel</th><th>Agent</th><th>Status</th><th>Latency</th><th>When</th><th>Correlation</th></tr></thead>
    <tbody>
      {#each interactions as interaction (interaction.id)}
        <tr><th scope="row"><button type="button" aria-pressed={selectedId === interaction.correlationId} onclick={() => onSelect(interaction.correlationId)} class="font-medium text-tint-accent hover:underline">/{commandLabel(interaction)}</button></th>
          <td>{interaction.actor}</td><td>#{interaction.channel}</td><td>{interaction.agent ?? 'inline'}</td><td>{interaction.status}</td><td>{formatMs(interaction.latencyMs)}</td><td>{formatTickAge(interaction.tick)}</td><td><code>{interaction.correlationId}</code></td></tr>
      {:else}<tr><td colspan="8">No slash commands match. Widen the filters to see more traffic.</td></tr>{/each}
    </tbody>
  </table>
</div>

<style>
  th, td { padding: .55rem .5rem; border-bottom: 1px solid var(--tint-border); vertical-align: top; }
  thead { color: var(--tint-muted); }
  button { border: 0; background: none; padding: 0; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
