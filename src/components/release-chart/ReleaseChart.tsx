import { ScatterPlot } from "../scatter-plot";
/** Compatibility adapter for size in GiB and supplied policy scores. */
export function ReleaseChart({
  rows,
}: {
  rows: readonly { id: string; size: number; score: number }[];
}) {
  return (
    <div data-tint-release-chart>
      <ScatterPlot
        rows={rows
          .filter((row) => row.size >= 0)
          .map((row) => ({ id: row.id, x: row.size, y: row.score }))}
        label="Release scores compared with file size"
        xLabel="Release size (GiB)"
        yLabel="Policy score"
        rowLabel="Release"
        tableCaption="Release score data"
        emptyText="No valid release scores available."
      />
    </div>
  );
}
