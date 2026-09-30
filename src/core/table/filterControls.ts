import type { DataFilterField, DataFilterItem, DataFilterOperator } from './filterTypes'

const TEXT_OPERATORS: readonly DataFilterOperator[] = ['contains', 'equals', 'notEquals']
const NUMBER_OPERATORS: readonly DataFilterOperator[] = ['equals', 'gte', 'lte', 'gt', 'lt']

export const FILTER_OPERATOR_LABELS: Record<DataFilterOperator, string> = {
  contains: 'contains',
  equals: 'is',
  notEquals: 'is not',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
}

export function operatorsFor(field: DataFilterField): readonly DataFilterOperator[] {
  if (field.operators?.length) return field.operators
  return field.type === 'number' ? NUMBER_OPERATORS : TEXT_OPERATORS
}

export function optionLabel(field: DataFilterField, value: string | number): string {
  return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value)
}

export function buildFilterItem(
  id: string,
  field: DataFilterField,
  operator: DataFilterOperator,
  rawValue: string,
): DataFilterItem {
  return {
    id,
    field: field.id,
    operator,
    value: field.type === 'number' ? Number(rawValue) : rawValue,
    displayValue: field.type === 'select' ? optionLabel(field, rawValue) : undefined,
  }
}
