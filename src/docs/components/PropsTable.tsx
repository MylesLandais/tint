type PropRow = {
  name: string
  type: string
  defaultValue?: string
  description: string
  required?: boolean
}

type PropsTableProps = {
  rows: PropRow[]
}

export function PropsTable({ rows }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-tint-border bg-tint-panel">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-tint-surface text-tint-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Default</th>
            <th className="px-4 py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-tint-border align-top">
              <td className="px-4 py-3 font-mono text-[13px] text-tint-accent">
                {row.name}
                {row.required ? <span className="text-tint-danger"> *</span> : null}
              </td>
              <td className="px-4 py-3 font-mono text-[13px] text-tint-ink">
                {row.type}
              </td>
              <td className="px-4 py-3 font-mono text-[13px] text-tint-muted">
                {row.defaultValue ?? '—'}
              </td>
              <td className="px-4 py-3 text-tint-muted">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
