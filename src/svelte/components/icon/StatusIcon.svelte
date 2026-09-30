<script lang="ts">
  import { STATUS_PRESENTATION, type StatusName } from '../../../core/icon/status'
  import type { IconSize } from '../../../core/icon/sizes'
  import Icon from './Icon.svelte'
  import { STATUS_GLYPHS } from './glyphs'

  type Props = {
    status: StatusName
    size?: IconSize
    /** Overrides the default accessible name for the status. */
    label?: string
    class?: string
  }

  let { status, size = 'md', label, class: className }: Props = $props()

  const presentation = $derived(STATUS_PRESENTATION[status])
</script>

<span
  class={['tint-status-icon', className]}
  data-status={status}
  data-spin={presentation.spin || undefined}
  style:color={`var(--tint-${presentation.tone})`}
>
  <Icon icon={STATUS_GLYPHS[status]} {size} label={label ?? presentation.label} />
</span>

<style>
  .tint-status-icon {
    display: inline-flex;
  }
  .tint-status-icon[data-spin] {
    animation: tint-spin 1s linear infinite;
  }
  @keyframes tint-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tint-status-icon[data-spin] {
      animation: none;
    }
  }
</style>
