export type DataFilterOperator =
  | 'contains'
  | 'equals'
  | 'notEquals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'

export type DataFilterOption = {
  value: string | number
  label: string
}

export type DataFilterField = {
  id: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: readonly DataFilterOption[]
  operators?: readonly DataFilterOperator[]
  sortable?: boolean
}

export type DataFilterItem = {
  id: string
  field: string
  operator: DataFilterOperator
  value: string | number
  /** Human-facing property value when the stored value is an opaque identifier. */
  displayValue?: string
}

export type DataFilterModel = {
  items: readonly DataFilterItem[]
}

/** Deliberately matches TanStack Table's SortingState item shape. */
export type DataSortItem = {
  id: string
  desc: boolean
}

export type DataSortingState = readonly DataSortItem[]
