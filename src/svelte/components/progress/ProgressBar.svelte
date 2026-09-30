<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { normalizeProgress } from '../../../core/progress/model'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    /** Progress in the range 0–100. */
    value: number
    /** Accessible name when no visible label is adjacent. */
    label?: string
    /** Show the numeric percent beside the track. */
    showValue?: boolean
  }

  let { value, label, showValue = false, class: className, ...rest }: Props = $props()
  let clamped = $derived(normalizeProgress(value))
</script>

<div {...rest} data-progress-bar="" class={['tint-progress', className]}>
  <div
    class="track"
    role="progressbar"
    aria-label={label}
    aria-valuenow={Math.round(clamped)}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span class="fill" style:width={`${clamped}%`}></span>
  </div>
  {#if showValue}<span class="value">{Math.round(clamped)}%</span>{/if}
</div>

<style>
  .tint-progress { display: flex; min-width: 0; align-items: center; gap: .5rem; }
  .track { height: .375rem; min-width: 0; flex: 1; overflow: hidden; border-radius: var(--tint-radius-full); background: var(--tint-surface); }
  .fill { display: block; height: 100%; border-radius: inherit; background: var(--tint-accent); transition: width var(--tint-motion-base) var(--tint-ease); }
  .value { flex-shrink: 0; color: var(--tint-muted); font-family: var(--font-mono); font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
</style>
