<!-- Dense label/value list for inspectors (Lightroom metadata panel). -->
<script lang="ts">
  type Row = { label: string; value: string | number | null | undefined; mono?: boolean }
  let { rows }: { rows: readonly Row[] } = $props()
  const shown = $derived(rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== ""))
</script>

{#if shown.length}
  <dl data-tint-property-list class="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-3 gap-y-1 text-xs">
    {#each shown as row (row.label)}
      <dt class="text-tint-muted">{row.label}</dt>
      <dd class={["m-0 min-w-0 break-words text-tint-ink", row.mono && "font-mono"]}>{row.value}</dd>
    {/each}
  </dl>
{/if}
