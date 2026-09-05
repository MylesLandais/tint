import type { ReactNode } from "react";
export type ScatterPoint = { id: string; label?: string; x: number; y: number };
export type ScatterPlotProps = {
  rows: readonly ScatterPoint[];
  label: string;
  xLabel: string;
  yLabel: string;
  rowLabel?: string;
  tableCaption?: string;
  emptyText?: ReactNode;
  selectedId?: string;
  onSelect?: (id: string) => void;
};
function axis(values: number[]) {
  const min = values.reduce((min, value) => Math.min(min, value), 0),
    max = values.reduce((max, value) => Math.max(max, value), 0);
  const scale = Math.max(Math.abs(min), Math.abs(max)) || 1,
    range = max / scale - min / scale || 1;
  return {
    min,
    max,
    ratio: (value: number) => (value / scale - min / scale) / range,
  };
}
/** Controlled numeric plot with an equivalent keyboard-accessible data table. */
export function ScatterPlot({
  rows,
  label,
  xLabel,
  yLabel,
  rowLabel = "Item",
  tableCaption = "Chart data",
  emptyText = "No valid data available.",
  selectedId,
  onSelect,
}: ScatterPlotProps) {
  const data = rows.filter(
      (row) => Number.isFinite(row.x) && Number.isFinite(row.y),
    ),
    x = axis(data.map((row) => row.x)),
    y = axis(data.map((row) => row.y));
  return (
    <div data-tint-scatter-plot style={{ color: "var(--tint-ink)" }}>
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 640 270"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <path d="M 80 24 V 220 H 610" fill="none" stroke="var(--tint-border)" />
        <g fill="var(--tint-muted)" fontSize="12">
          <text x="345" y="260" textAnchor="middle">
            {xLabel}
          </text>
          <text transform="translate(18 122) rotate(-90)" textAnchor="middle">
            {yLabel}
          </text>
          <text x="80" y="239" textAnchor="middle">
            {x.min}
          </text>
          <text x="610" y="239" textAnchor="end">
            {x.max}
          </text>
          <text x="70" y="220" textAnchor="end">
            {y.min}
          </text>
          <text x="70" y="28" textAnchor="end">
            {y.max}
          </text>
        </g>
        {data.map((row, index) => (
          <circle
            key={`${row.id}:${index}`}
            cx={80 + x.ratio(row.x) * 530}
            cy={220 - y.ratio(row.y) * 196}
            r={row.id === selectedId ? 8 : 5}
            fill="var(--tint-accent)"
            onClick={() => onSelect?.(row.id)}
          >
            <title>{`${row.label ?? row.id}: ${row.x}, ${row.y}`}</title>
          </circle>
        ))}
      </svg>
      {!data.length ? <p>{emptyText}</p> : null}
      <div style={{ overflowX: "auto", maxHeight: "18rem" }}>
        <table
          style={{
            width: "100%",
            textAlign: "left",
            fontSize: ".75rem",
            borderCollapse: "collapse",
          }}
        >
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{rowLabel}</th>
              <th scope="col">{xLabel}</th>
              <th scope="col">{yLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={`${row.id}:${index}`}>
                <th scope="row">
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={selectedId === row.id}
                      onClick={() => onSelect(row.id)}
                    >
                      {row.label ?? row.id}
                    </button>
                  ) : (
                    (row.label ?? row.id)
                  )}
                </th>
                <td>{row.x}</td>
                <td>{row.y}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
