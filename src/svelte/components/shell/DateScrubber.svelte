<!--
  Vertical month scrubber (Immich). Each month's share of the rail is
  proportional to its count. Year labels are always visible; the current
  month carries a thumb; hover shows month and count.
-->
<script lang="ts">
  type Bucket = { month: string; count: number }
  type Props = { buckets: readonly Bucket[]; current?: string | null; onjump: (month: string) => void; label?: string }
  let { buckets, current = null, onjump, label = "Jump to date" }: Props = $props()
  const total = $derived(buckets.reduce((sum, b) => sum + b.count, 0) || 1)
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" })
  function name(month: string) {
    const [y, m] = month.split("-").map(Number)
    return fmt.format(new Date(y, m - 1, 1))
  }
  const firstOfYear = $derived(new Set(buckets.filter((b, i) => i === 0 || buckets[i - 1].month.slice(0, 4) !== b.month.slice(0, 4)).map((b) => b.month)))
</script>

<nav data-tint-date-scrubber aria-label={label} class="flex h-full w-full flex-col py-1">
  {#each buckets as bucket (bucket.month)}
    {@const on = current === bucket.month}
    <button
      type="button"
      class="group relative min-h-1.5 w-full text-right outline-none"
      style:flex-grow={Math.max(bucket.count / total, 0.006)}
      aria-label={`${name(bucket.month)}: ${bucket.count.toLocaleString()} items`}
      aria-current={on ? "true" : undefined}
      onclick={() => onjump(bucket.month)}
    >
      <span class={["absolute bottom-px right-1 top-px w-1 rounded-[1px] transition-colors duration-[110ms]", on ? "bg-tint-accent" : "bg-tint-border-strong group-hover:bg-tint-ink group-focus-visible:bg-tint-ink"]}></span>
      {#if firstOfYear.has(bucket.month)}
        <span class="pointer-events-none absolute right-3 top-0 font-mono text-[0.625rem] leading-none text-tint-muted">{bucket.month.slice(0, 4)}</span>
      {/if}
      {#if on}<span class="pointer-events-none absolute right-0 top-1/2 h-0.5 w-3 -translate-y-1/2 bg-tint-accent"></span>{/if}
      <span class="pointer-events-none absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded-[2px] bg-tint-ink px-1.5 py-0.5 font-mono text-[0.6875rem] text-tint-bg group-hover:block group-focus-visible:block">
        {name(bucket.month)} · {bucket.count.toLocaleString()}
      </span>
    </button>
  {/each}
</nav>
