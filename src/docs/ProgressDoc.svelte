<script lang="ts">
  import ProgressBar from '../svelte/components/progress/ProgressBar.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let value = $state(64)
  const api: ApiRow[] = [
    { prop: 'value', type: 'number', description: 'Percentage, clamped to 0–100.' },
    { prop: 'label', type: 'string', description: 'Accessible name for the progressbar.' },
    { prop: 'showValue', type: 'boolean', description: 'Display the current percent beside the track.' },
  ]
  const usage = `import { ProgressBar } from '@nebula/tint/progress'

<ProgressBar value={64} label="Upload" showValue />`
</script>

<DocPage title="Progress" description="Determinate progress that reports its current value to assistive technology." importPath="@nebula/tint/progress" {usage} {api} accessibility="Give every progressbar an accessible name. The numeric value is exposed with aria-valuenow, and the fill transition stops under reduced motion.">
  <div class="demo"><label for="progress-value">Progress: {value}%</label><input id="progress-value" type="range" min="0" max="100" bind:value={value} /><ProgressBar {value} label="Example transfer" showValue /></div>
</DocPage>

<style>.demo { display: grid; gap: .75rem; max-width: 24rem; } input { accent-color: var(--tint-accent); }</style>
