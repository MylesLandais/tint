import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataFilterControls } from './DataFilterControls'
import type { DataFilterField, DataFilterModel, DataSortingState } from './filterTypes'

const fields: DataFilterField[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'fileSize', label: 'File size', type: 'number', sortable: true },
  {
    id: 'mediaType',
    label: 'Media type',
    type: 'select',
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
    ],
  },
]

function Harness({
  filterModel = { items: [] },
  sorting = [],
  onFilterModelChange = vi.fn(),
  onSortingChange = vi.fn(),
}: {
  filterModel?: DataFilterModel
  sorting?: DataSortingState
  onFilterModelChange?: (model: DataFilterModel) => void
  onSortingChange?: (sorting: DataSortingState) => void
}) {
  return (
    <DataFilterControls
      fields={fields}
      filterModel={filterModel}
      onFilterModelChange={onFilterModelChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  )
}

describe('DataFilterControls', () => {
  it('renders property labels separately from display values and never needs internal IDs', () => {
    render(
      <Harness
        filterModel={{
          items: [
            {
              id: 'person-filter',
              field: 'name',
              operator: 'equals',
              value: 'ca70aeb3-0782-4cff-8379-b60664350f3c',
              displayValue: 'Natalie Monroe',
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('name:')).toHaveAttribute('data-filter-label')
    expect(screen.getByText('Natalie Monroe')).toHaveAttribute('data-filter-value')
    expect(screen.queryByText('ca70aeb3-0782-4cff-8379-b60664350f3c')).not.toBeInTheDocument()
  })

  it('adds a typed numeric filter through a controlled model', () => {
    const change = vi.fn()
    render(<Harness onFilterModelChange={change} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add filter' }))
    fireEvent.change(screen.getByLabelText('Filter property'), { target: { value: 'fileSize' } })
    fireEvent.change(screen.getByLabelText('Filter operator'), { target: { value: 'gte' } })
    fireEvent.change(screen.getByLabelText('Filter value'), { target: { value: '1048576' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }))

    expect(change).toHaveBeenCalledWith({
      items: [expect.objectContaining({ field: 'fileSize', operator: 'gte', value: 1048576 })],
    })
  })

  it('removes one filter without disturbing the others', () => {
    const change = vi.fn()
    const filterModel: DataFilterModel = {
      items: [
        { id: 'a', field: 'mediaType', operator: 'equals', value: 'video' },
        { id: 'b', field: 'fileSize', operator: 'gte', value: 1024 },
      ],
    }
    render(<Harness filterModel={filterModel} onFilterModelChange={change} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Media type Video filter' }))
    expect(change).toHaveBeenCalledWith({ items: [filterModel.items[1]] })
  })

  it('emits TanStack-shaped sorting state', () => {
    const change = vi.fn()
    render(<Harness onSortingChange={change} />)

    fireEvent.change(screen.getByLabelText('Sort results'), { target: { value: 'fileSize' } })
    expect(change).toHaveBeenCalledWith([{ id: 'fileSize', desc: false }])
  })

  it('toggles the active sort direction', () => {
    const change = vi.fn()
    render(<Harness sorting={[{ id: 'fileSize', desc: true }]} onSortingChange={change} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sort ascending' }))
    expect(change).toHaveBeenCalledWith([{ id: 'fileSize', desc: false }])
  })
})
