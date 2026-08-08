import { ArrowDown, ArrowUp, Filter, Plus, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import type {
  DataFilterField,
  DataFilterItem,
  DataFilterModel,
  DataFilterOperator,
  DataSortingState,
} from './filterTypes'

const TEXT_OPERATORS: readonly DataFilterOperator[] = ['contains', 'equals', 'notEquals']
const NUMBER_OPERATORS: readonly DataFilterOperator[] = ['equals', 'gte', 'lte', 'gt', 'lt']
const OPERATOR_LABELS: Record<DataFilterOperator, string> = {
  contains: 'contains',
  equals: 'is',
  notEquals: 'is not',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
}

export type DataFilterControlsProps = {
  fields: readonly DataFilterField[]
  filterModel: DataFilterModel
  onFilterModelChange: (model: DataFilterModel) => void
  sorting?: DataSortingState
  onSortingChange?: (sorting: DataSortingState) => void
  allowAdd?: boolean
  className?: string
  addLabel?: string
  sortLabel?: string
}

function operatorsFor(field: DataFilterField): readonly DataFilterOperator[] {
  if (field.operators?.length) return field.operators
  return field.type === 'number' ? NUMBER_OPERATORS : TEXT_OPERATORS
}

function optionLabel(field: DataFilterField, value: string | number): string {
  return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value)
}

function newFilterId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `filter-${Date.now()}`
}

export function DataFilterControls({
  fields,
  filterModel,
  onFilterModelChange,
  sorting = [],
  onSortingChange,
  allowAdd = true,
  className,
  addLabel = 'Add filter',
  sortLabel = 'Sort results',
}: DataFilterControlsProps) {
  const formId = useId()
  const [adding, setAdding] = useState(false)
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? '')
  const field = fields.find((candidate) => candidate.id === fieldId) ?? fields[0]
  const operators = field ? operatorsFor(field) : []
  const [operator, setOperator] = useState<DataFilterOperator>(operators[0] ?? 'equals')
  const [value, setValue] = useState('')
  const activeSort = sorting[0]
  const sortableFields = useMemo(() => fields.filter((candidate) => candidate.sortable), [fields])

  const chooseField = (nextId: string) => {
    const nextField = fields.find((candidate) => candidate.id === nextId)
    setFieldId(nextId)
    setOperator(nextField ? operatorsFor(nextField)[0]! : 'equals')
    setValue('')
  }

  const addFilter = () => {
    if (!field || value === '') return
    const item: DataFilterItem = {
      id: newFilterId(),
      field: field.id,
      operator,
      value: field.type === 'number' ? Number(value) : value,
      displayValue: field.type === 'select' ? optionLabel(field, value) : undefined,
    }
    onFilterModelChange({ items: [...filterModel.items, item] })
    setValue('')
    setAdding(false)
  }

  const removeFilter = (id: string) => {
    onFilterModelChange({ items: filterModel.items.filter((item) => item.id !== id) })
  }

  return (
    <div
      data-filter-controls=""
      className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}
    >
      {filterModel.items.map((item) => {
        const itemField = fields.find((candidate) => candidate.id === item.field)
        const label = itemField?.label ?? item.field
        const displayValue = item.displayValue ?? (itemField ? optionLabel(itemField, item.value) : String(item.value))
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => removeFilter(item.id)}
            aria-label={`Remove ${label} ${displayValue} filter`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-tint-accent/30 bg-tint-accent-soft px-2.5 text-xs text-tint-ink transition hover:border-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <span data-filter-label="" className="text-[0.625rem] font-semibold text-tint-muted">
              {label.toLowerCase()}:
            </span>
            <span data-filter-value="" className="font-medium">{displayValue}</span>
            <Icon icon={X} size="sm" aria-hidden="true" />
          </button>
        )
      })}

      {allowAdd && fields.length ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setAdding((open) => !open)}
            aria-expanded={adding}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-tint-border bg-tint-panel px-2.5 text-xs font-medium text-tint-muted hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <Icon icon={Plus} size="sm" />
            {addLabel}
          </button>
          {adding ? (
            <div className="absolute top-[calc(100%+0.375rem)] left-0 z-30 grid w-72 gap-2 rounded-xl border border-tint-border bg-tint-panel p-3 shadow-xl">
              <label className="grid gap-1 text-xs text-tint-muted" htmlFor={`${formId}-field`}>
                Property
                <select id={`${formId}-field`} aria-label="Filter property" value={field?.id ?? ''} onChange={(event) => chooseField(event.target.value)} className="min-h-9 rounded-lg border border-tint-border bg-tint-surface px-2 text-tint-ink">
                  {fields.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-tint-muted" htmlFor={`${formId}-operator`}>
                Operator
                <select id={`${formId}-operator`} aria-label="Filter operator" value={operator} onChange={(event) => setOperator(event.target.value as DataFilterOperator)} className="min-h-9 rounded-lg border border-tint-border bg-tint-surface px-2 text-tint-ink">
                  {operators.map((candidate) => <option key={candidate} value={candidate}>{OPERATOR_LABELS[candidate]}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-tint-muted" htmlFor={`${formId}-value`}>
                Value
                {field?.type === 'select' ? (
                  <select id={`${formId}-value`} aria-label="Filter value" value={value} onChange={(event) => setValue(event.target.value)} className="min-h-9 rounded-lg border border-tint-border bg-tint-surface px-2 text-tint-ink">
                    <option value="">Choose…</option>
                    {field.options?.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
                  </select>
                ) : (
                  <input id={`${formId}-value`} aria-label="Filter value" type={field?.type === 'number' ? 'number' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} className="min-h-9 rounded-lg border border-tint-border bg-tint-surface px-2 text-tint-ink" />
                )}
              </label>
              <button type="button" onClick={addFilter} disabled={value === ''} className="min-h-9 rounded-lg bg-tint-accent px-3 text-xs font-semibold text-tint-on-accent disabled:opacity-50">
                Apply filter
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {onSortingChange && sortableFields.length ? (
        <div className="ml-auto inline-flex items-center gap-1 rounded-lg border border-tint-border bg-tint-panel p-0.5">
          <Icon icon={Filter} size="sm" className="ml-1.5 text-tint-muted" aria-hidden="true" />
          <select
            aria-label={sortLabel}
            value={activeSort?.id ?? ''}
            onChange={(event) => onSortingChange(event.target.value ? [{ id: event.target.value, desc: false }] : [])}
            className="min-h-8 bg-transparent px-1.5 text-xs text-tint-ink outline-none"
          >
            <option value="">Default order</option>
            {sortableFields.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
          </select>
          {activeSort ? (
            <button
              type="button"
              aria-label={activeSort.desc ? 'Sort ascending' : 'Sort descending'}
              onClick={() => onSortingChange([{ ...activeSort, desc: !activeSort.desc }])}
              className="grid size-8 place-items-center rounded-md text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
            >
              <Icon icon={activeSort.desc ? ArrowDown : ArrowUp} size="sm" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
