import { render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, expect, it, vi } from 'vitest'
import { CollectionWorkspace, CollectionWorkbench } from '../components/table'
import DataTable from '../components/table/DataTable.svelte'
import type { Component } from 'svelte'
import type { DataTableProps } from '../components/table/types'
const TypedTable = DataTable as Component<DataTableProps<{ id: string; genre: string }>>

afterEach(() => vi.restoreAllMocks())
it('retains the same public collection component identity for one release', () => {
  expect(CollectionWorkbench).toBe(CollectionWorkspace)
})
it('renders old table props and gives reactive new values precedence', async () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700)
  const props: DataTableProps<{ id: string; genre: string }> = { rows: [{ id: 'a', genre: 'House' }], columns: [{ id: 'genre', header: 'Genre' }], rowId: 'id', workbenchResponsive: true }
  const { container, rerender } = render(TypedTable, props)
  await waitFor(() => expect(screen.queryByRole('columnheader', { name: 'Genre' })).toBeNull())
  expect(container.querySelector('[data-table]')).toHaveAttribute('data-workbench-responsive', 'true')
  await rerender({ ...props, workspaceResponsive: false })
  expect(screen.getByRole('columnheader', { name: 'Genre' })).toBeVisible()
  expect(container.querySelector('[data-table]')).not.toHaveAttribute('data-workbench-responsive')
  await rerender({ ...props, workspaceResponsive: true })
  await waitFor(() => expect(screen.queryByRole('columnheader', { name: 'Genre' })).toBeNull())
  expect(container.querySelector('[data-table]')).toHaveAttribute('data-workspace-responsive', 'true')
})
