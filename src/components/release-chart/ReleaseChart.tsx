/** Controlled score/size plot. Sizes are GiB; scores are supplied, never computed. */
export function ReleaseChart({ rows }: { rows: readonly { id: string; size: number; score: number }[] }) {
  const data = rows.filter((row) => Number.isFinite(row.size) && row.size >= 0 && Number.isFinite(row.score))
  const maxSize = data.reduce((max, row) => Math.max(max, row.size), 0) || 1
  const minScore = data.reduce((min, row) => Math.min(min, row.score), 0)
  const maxScore = data.reduce((max, row) => Math.max(max, row.score), 0)
  // Normalize before subtraction to avoid overflow for opposite finite extremes.
  const scoreScale = Math.max(Math.abs(minScore), Math.abs(maxScore)) || 1
  const scoreRange = maxScore / scoreScale - minScore / scoreScale || 1

  return <div data-tint-release-chart="" style={{ color: 'var(--tint-ink)' }}>
    <svg role="img" aria-label="Release scores compared with file size" viewBox="0 0 640 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d="M 80 24 V 220 H 610" fill="none" stroke="var(--tint-border)" />
      <g fill="var(--tint-muted)" fontSize="12">
        <text x="345" y="260" textAnchor="middle">Release size (GiB)</text>
        <text transform="translate(18 122) rotate(-90)" textAnchor="middle">Policy score</text>
        <text x="80" y="239" textAnchor="middle">0</text>
        <text x="610" y="239" textAnchor="end">{maxSize}</text>
        <text x="70" y="220" textAnchor="end">{minScore}</text>
        <text x="70" y="28" textAnchor="end">{maxScore}</text>
      </g>
      {data.map((row, index) => <circle key={`${row.id}:${index}`} cx={80 + row.size / maxSize * 530} cy={220 - (row.score / scoreScale - minScore / scoreScale) / scoreRange * 196} r="5" fill="var(--tint-accent)">
        <title>{`${row.id}: ${row.size} GiB, score ${row.score}`}</title>
      </circle>)}
    </svg>
    {data.length === 0 ? <p>No valid release scores available.</p> : null}
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', textAlign: 'left', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
        <caption>Release score data</caption>
        <thead><tr><th scope="col">Release</th><th scope="col">Release size (GiB)</th><th scope="col">Policy score</th></tr></thead>
        <tbody>{data.map((row, index) => <tr key={`${row.id}:${index}`}><th scope="row">{row.id}</th><td>{row.size}</td><td>{row.score}</td></tr>)}</tbody>
      </table>
    </div>
  </div>
}
