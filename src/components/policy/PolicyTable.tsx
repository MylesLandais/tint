import { Badge } from '../badge'
import { DataTable } from '../table'
import type { TableColumn } from '../table'
import type { PolicyDisposition, PolicyRule } from './contracts'

export type PolicyTableProps = {
  rules: readonly PolicyRule[]
  selectedId?: string | null
  onSelect?: (ruleId: string) => void
  onToggle?: (ruleId: string, enabled: boolean) => void
  sourceLabels?: Readonly<Record<string, string>>
  className?: string
  density?: 'compact' | 'comfortable' | 'spacious'
}

const DISPOSITION_TONE: Record<PolicyDisposition, 'accent' | 'info' | 'success'> = {
  auto_queue: 'accent',
  notify_only: 'info',
  notify_and_cache: 'success',
}

/**
 * DataTable of policy rules: name, disposition, match count, enabled toggle.
 *
 * Toggle reports via `onToggle` — the host runs `applyPolicyCommand`; the table
 * never mutates the document itself.
 */
export function PolicyTable({
  rules,
  selectedId = null,
  onSelect,
  onToggle,
  sourceLabels,
  className,
  density = 'comfortable',
}: PolicyTableProps) {
  const columns: TableColumn<PolicyRule>[] = [
    {
      id: 'name',
      header: 'Rule',
      sortable: true,
      renderCell: (row) => (
        <button
          type="button"
          className="text-left font-medium text-tint-ink hover:underline"
          onClick={() => onSelect?.(row.id)}
        >
          {row.name}
        </button>
      ),
    },
    {
      id: 'sourceId',
      header: 'Source',
      accessor: (row) => sourceLabels?.[row.sourceId] ?? row.sourceId,
      sortable: true,
    },
    {
      id: 'disposition',
      header: 'Disposition',
      renderCell: (row) => (
        <Badge tone={DISPOSITION_TONE[row.disposition]}>{row.disposition}</Badge>
      ),
    },
    {
      id: 'matchCount',
      header: 'Matches',
      type: 'number',
      sortable: true,
      align: 'end',
    },
    {
      id: 'enabled',
      header: 'On',
      hideable: false,
      renderCell: (row) => (
        <input
          type="checkbox"
          checked={row.enabled}
          aria-label={`Enable ${row.name}`}
          onChange={(event) => onToggle?.(row.id, event.target.checked)}
        />
      ),
    },
  ]

  return (
    <div
      data-tint-policy-table=""
      data-selected={selectedId ?? undefined}
      className={className}
    >
      <DataTable
        rows={rules}
        columns={columns}
        rowId="id"
        density={density}
        label="Policy rules"
        selection={selectedId ? [selectedId] : []}
        onSelectionChange={
          onSelect
            ? (change) => {
                const next = change.selection[0]
                if (next) onSelect(next)
              }
            : undefined
        }
      />
    </div>
  )
}
