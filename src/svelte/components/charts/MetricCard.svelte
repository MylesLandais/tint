<script lang="ts">
  import Surface from '../surface/Surface.svelte'
  import type { MetricCardProps } from './types'

  let { label, value, hint, icon, tone = 'default', trend, class: className, ...rest }: MetricCardProps = $props()
</script>

<Surface
  {...rest}
  as="article"
  data-tint-metric-card=""
  tone={tone === 'success' ? 'default' : tone}
  class={['px-3 py-2.5', tone === 'success' && 'border-tint-success/40', className]}
>
  <p class="m-0 flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-wide text-tint-muted uppercase">
    {#if icon}{@render icon()}{/if}
    {#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
  </p>
  <p class="m-0 mt-1 text-lg font-semibold text-tint-ink">
    {#if typeof value === 'function'}{@render value()}{:else}{value}{/if}
  </p>
  {#if hint !== undefined || trend}
    <p class="m-0 mt-0.5 text-[0.6875rem] text-tint-muted">
      {#if typeof hint === 'function'}{@render hint()}{:else}{hint}{/if}
      {#if hint !== undefined && trend} · {/if}
      {#if trend}<span data-direction={trend.direction}>{trend.label}</span>{/if}
    </p>
  {/if}
</Surface>
