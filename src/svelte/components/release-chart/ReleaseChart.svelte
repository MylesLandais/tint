<script lang="ts">
  import { releaseScatterRows, type ReleaseScore } from '../../../core/release-chart/model'
  import ScatterPlot from '../scatter-plot/ScatterPlot.svelte'

  let { rows, class: className }: { rows: readonly ReleaseScore[]; class?: string } = $props()
  let points = $derived(releaseScatterRows(rows))
</script>

<div data-tint-release-chart="" class={className}>
  <ScatterPlot
    rows={points}
    label="Release scores compared with file size"
    xLabel="Release size (GiB)"
    yLabel="Policy score"
    rowLabel="Release"
    tableCaption="Release score data"
    emptyText="No valid release scores available."
  />
</div>
