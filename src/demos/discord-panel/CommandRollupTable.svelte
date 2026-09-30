<script lang="ts">
  import { commandRollups } from './correlation'
  import { formatMs } from './fixtures'
  import type { SlashInteraction } from './types'
  let { interactions }: { interactions: readonly SlashInteraction[] } = $props()
  let rollups = $derived(commandRollups(interactions))
</script>

<div class="overflow-x-auto"><table aria-label="Command rollups" class="w-full min-w-[35rem] border-collapse text-left text-xs">
  <thead><tr><th>Command</th><th>Calls</th><th>Failed</th><th>Failure rate</th><th>p50</th><th>p95</th><th>Handled by</th></tr></thead>
  <tbody>{#each rollups as row (row.command)}<tr><th scope="row"><code>/{row.command}</code></th><td>{row.invocations}</td><td>{row.failures}</td><td>{Math.round(row.failureRate * 100)}%</td><td>{formatMs(row.p50Ms)}</td><td>{formatMs(row.p95Ms)}</td><td>{row.agents.join(', ') || 'inline'}</td></tr>
    {:else}<tr><td colspan="7">No commands in range</td></tr>{/each}</tbody>
</table></div>

<style>th, td { padding: .55rem .5rem; border-bottom: 1px solid var(--tint-border); } thead { color: var(--tint-muted); }</style>
