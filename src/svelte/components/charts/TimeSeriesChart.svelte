<script lang="ts">
  import ChartFrame from './ChartFrame.svelte'
  import type { ChartProps } from './types'
  let props: ChartProps = $props()
</script>

<ChartFrame kind="line" {...props} />
