<script lang="ts">
  import type {
    DataFilterField, DataFilterModel, DataFilterOperator, DataSortingState,
  } from '../../../core/table/filterTypes'
  import { buildFilterItem, FILTER_OPERATOR_LABELS, operatorsFor, optionLabel } from '../../../core/table/filterControls'

  type Props = {
    fields: readonly DataFilterField[]
    filterModel: DataFilterModel
    onFilterModelChange: (model: DataFilterModel) => void
    sorting?: DataSortingState
    onSortingChange?: (sorting: DataSortingState) => void
    allowAdd?: boolean
    addLabel?: string
    sortLabel?: string
    class?: string
  }

  let {
    fields, filterModel, onFilterModelChange, sorting = [], onSortingChange,
    allowAdd = true, addLabel = 'Add filter', sortLabel = 'Sort results', class: className,
  }: Props = $props()

  const id = $props.id()
  let adding = $state(false)
  let fieldId = $state('')
  let operator = $state<DataFilterOperator>('equals')
  let value = $state('')
  let field = $derived(fields.find((candidate) => candidate.id === fieldId) ?? fields[0])
  let operators = $derived(field ? operatorsFor(field) : [])
  let sortableFields = $derived(fields.filter((candidate) => candidate.sortable))
  let activeSort = $derived(sorting[0])

  $effect(() => {
    if (fieldId || !fields[0]) return
    fieldId = fields[0].id
    operator = operatorsFor(fields[0])[0] ?? 'equals'
  })

  function chooseField(nextId: string) {
    fieldId = nextId
    const next = fields.find((candidate) => candidate.id === nextId)
    operator = next ? operatorsFor(next)[0] ?? 'equals' : 'equals'
    value = ''
  }

  function addFilter() {
    if (!field || value === '') return
    const filterId = globalThis.crypto?.randomUUID?.() ?? `filter-${Date.now()}`
    onFilterModelChange({ items: [...filterModel.items, buildFilterItem(filterId, field, operator, value)] })
    value = ''
    adding = false
  }

  function removeFilter(filterId: string) {
    onFilterModelChange({ items: filterModel.items.filter((item) => item.id !== filterId) })
  }
</script>

<div data-filter-controls="" class={className}>
  {#each filterModel.items as item (item.id)}
    {@const itemField = fields.find((candidate) => candidate.id === item.field)}
    {@const label = itemField?.label ?? item.field}
    {@const displayValue = item.displayValue ?? (itemField ? optionLabel(itemField, item.value) : String(item.value))}
    <button type="button" class="filter-chip" aria-label={`Remove ${label} ${displayValue} filter`} onclick={() => removeFilter(item.id)}>
      <span data-filter-label="">{label.toLowerCase()}:</span>
      <span data-filter-value="">{displayValue}</span>
      <span aria-hidden="true">×</span>
    </button>
  {/each}

  {#if allowAdd && fields.length}
    <div class="add-wrap">
      <button type="button" class="add-trigger" aria-expanded={adding} aria-controls={`${id}-form`} onclick={() => adding = !adding}><span aria-hidden="true">＋</span> {addLabel}</button>
      {#if adding}
        <div id={`${id}-form`} class="add-form">
          <label for={`${id}-field`}>Property
            <select id={`${id}-field`} aria-label="Filter property" value={field?.id ?? ''} onchange={(event) => chooseField(event.currentTarget.value)}>
              {#each fields as candidate (candidate.id)}<option value={candidate.id}>{candidate.label}</option>{/each}
            </select>
          </label>
          <label for={`${id}-operator`}>Operator
            <select id={`${id}-operator`} aria-label="Filter operator" value={operator} onchange={(event) => operator = event.currentTarget.value as DataFilterOperator}>
              {#each operators as candidate (candidate)}<option value={candidate}>{FILTER_OPERATOR_LABELS[candidate]}</option>{/each}
            </select>
          </label>
          <label for={`${id}-value`}>Value
            {#if field?.type === 'select'}
              <select id={`${id}-value`} aria-label="Filter value" value={value} onchange={(event) => value = event.currentTarget.value}>
                <option value="">Choose…</option>
                {#each field.options ?? [] as option (String(option.value))}<option value={String(option.value)}>{option.label}</option>{/each}
              </select>
            {:else}
              <input id={`${id}-value`} aria-label="Filter value" type={field?.type === 'number' ? 'number' : 'text'} value={value} oninput={(event) => value = event.currentTarget.value} />
            {/if}
          </label>
          <button type="button" class="apply" disabled={value === ''} onclick={addFilter}>Apply filter</button>
        </div>
      {/if}
    </div>
  {/if}

  {#if onSortingChange && sortableFields.length}
    <div class="sort-controls">
      <select aria-label={sortLabel} value={activeSort?.id ?? ''} onchange={(event) => onSortingChange?.(event.currentTarget.value ? [{ id: event.currentTarget.value, desc: false }] : [])}>
        <option value="">Default order</option>
        {#each sortableFields as candidate (candidate.id)}<option value={candidate.id}>{candidate.label}</option>{/each}
      </select>
      {#if activeSort}
        <button type="button" aria-label={activeSort.desc ? 'Sort ascending' : 'Sort descending'} onclick={() => onSortingChange?.([{ ...activeSort!, desc: !activeSort!.desc }])}>{activeSort.desc ? '↓' : '↑'}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  [data-filter-controls] { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: var(--tint-space-2); }
  button, select, input { font: inherit; }
  button { cursor: pointer; }
  button:focus-visible, select:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  .filter-chip { display: inline-flex; align-items: center; gap: var(--tint-space-1); min-height: 2rem; border: 1px solid var(--tint-accent); border-radius: 999px; background: var(--tint-accent-soft); padding: 0 var(--tint-space-2); color: var(--tint-ink); font-size: var(--tint-font-size-xs); }
  [data-filter-label] { color: var(--tint-muted); font-size: 0.625rem; font-weight: 600; }
  .add-wrap { position: relative; }
  .add-trigger { min-height: 2rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .add-form { position: absolute; top: calc(100% + 0.375rem); left: 0; z-index: 30; display: grid; width: 18rem; gap: var(--tint-space-2); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); padding: var(--tint-space-3); box-shadow: 0 1rem 3rem var(--tint-shadow-color); }
  .add-form label { display: grid; gap: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .add-form select, .add-form input { min-height: 2.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: 0 var(--tint-space-2); color: var(--tint-ink); }
  .apply { min-height: 2.25rem; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-accent); color: var(--tint-on-accent); font-size: var(--tint-font-size-xs); font-weight: 600; }
  .apply:disabled { cursor: not-allowed; opacity: 0.5; }
  .sort-controls { display: inline-flex; align-items: center; gap: var(--tint-space-1); margin-left: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: var(--tint-space-1); }
  .sort-controls select, .sort-controls button { min-height: 2rem; border: 0; background: transparent; color: var(--tint-ink); font-size: var(--tint-font-size-xs); }
</style>
