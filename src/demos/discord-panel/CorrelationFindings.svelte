<script lang="ts">
  import type { CorrelationFinding } from './correlation'
  let { findings, onRun, hasRun, sampleSize }: { findings: readonly CorrelationFinding[]; onRun: () => void; hasRun: boolean; sampleSize: number } = $props()
</script>

<section aria-label="Correlation findings" class="rounded-lg border border-tint-border bg-tint-panel">
  <header class="flex flex-wrap items-center justify-between gap-2 border-b border-tint-border px-4 py-3"><h2 class="m-0 text-sm font-semibold">Correlations</h2><span class="text-xs text-tint-muted">{sampleSize} settled interactions</span><button type="button" onclick={onRun} class="rounded-md bg-tint-accent px-3 py-1.5 text-xs text-tint-on-accent">{hasRun ? 'Re-run' : 'Run correlations'}</button></header>
  {#if !hasRun}<p class="p-4 text-sm text-tint-muted">Not run yet</p>
  {:else if findings.length === 0}<p class="p-4 text-sm text-tint-muted">Nothing stands out</p>
  {:else}<ol class="m-0 grid list-none gap-3 p-4">
    {#each findings as finding (finding.id)}
      {@const magnitude = Math.min(1, Math.abs(finding.coefficient))}
      <li class="grid gap-1"><div class="flex flex-wrap items-baseline gap-2"><span class="text-sm font-medium">{finding.label}</span><span class="rounded bg-tint-surface px-1.5 text-xs">{finding.coefficient >= 0 ? '+' : '−'}{Math.abs(finding.coefficient).toFixed(2)}</span><small class="ml-auto text-tint-muted">n={finding.sampleSize}</small></div>
        <div aria-hidden="true" class="flex h-1.5"><span class="flex flex-1 justify-end"><span class="rounded-l bg-tint-success" style:width={finding.coefficient < 0 ? `${magnitude * 100}%` : '0%'}></span></span><span class="w-px bg-tint-border"></span><span class="flex flex-1"><span class="rounded-r bg-tint-danger" style:width={finding.coefficient >= 0 ? `${magnitude * 100}%` : '0%'}></span></span></div>
        <p class="m-0 text-xs text-tint-muted">{finding.detail}</p></li>
    {/each}
  </ol>{/if}
</section>

<style>
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
