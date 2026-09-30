<!--
  A bare loading spinner. Deliberately not <StatusIcon status="loading" />:
  spinners inherit their surrounding text colour rather than the info tone.
-->
<script lang="ts">
  import type { IconSize } from '../../../core/icon/sizes'
  import Icon from './Icon.svelte'
  import { GLYPHS } from './glyphs'

  type Props = { size?: IconSize; label?: string; class?: string }
  let { size = 'md', label, class: className }: Props = $props()
</script>

<span class={['tint-spinner', className]}>
  <Icon icon={GLYPHS.loader} {size} {label} />
</span>

<style>
  .tint-spinner {
    display: inline-flex;
    animation: tint-spin 1s linear infinite;
  }
  @keyframes tint-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tint-spinner {
      animation: none;
    }
  }
</style>
